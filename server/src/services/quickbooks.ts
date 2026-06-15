import { config } from '../config';
import { QBO_API_BASE, TRANSACTION_ENDPOINTS, QBO_SCOPES } from '../config/quickbooks';
import { QBOToken, CompanyInfo, ImportResult, ParsedTransaction, BatchOperationResult, TransactionType } from '../types';

export class QuickBooksService {
  private getApiUrl(realmId: string): string {
    return `${QBO_API_BASE[config.quickbooks.environment]}/v3/company/${realmId}`;
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: config.quickbooks.clientId,
      response_type: 'code',
      scope: QBO_SCOPES,
      redirect_uri: config.quickbooks.redirectUri,
      state: crypto.randomUUID(),
    });
    return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
  }

  async getTokenFromCode(code: string): Promise<QBOToken> {
    const tokenUrl = config.quickbooks.environment === 'sandbox'
      ? 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
      : 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

    const basicAuth = Buffer.from(
      `${config.quickbooks.clientId}:${config.quickbooks.clientSecret}`
    ).toString('base64');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.quickbooks.redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
        Accept: 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      realmId: data.realmId,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async refreshToken(token: QBOToken): Promise<QBOToken> {
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    const basicAuth = Buffer.from(
      `${config.quickbooks.clientId}:${config.quickbooks.clientSecret}`
    ).toString('base64');

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
        Accept: 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) throw new Error('Token refresh failed');

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      realmId: token.realmId,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  private async apiRequest<T>(
    token: QBOToken,
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.getApiUrl(token.realmId)}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`QBO API error: ${error}`);
    }

    return response.json();
  }

  async getCompanyInfo(token: QBOToken): Promise<CompanyInfo> {
    const data = await this.apiRequest<{ CompanyInfo: CompanyInfo }>(
      token, 'GET', '/companyinfo/' + token.realmId
    );
    return data.CompanyInfo;
  }

  async getTransactionTypes(): Promise<TransactionType[]> {
    return [
      'Invoice', 'Bill', 'Expense', 'Check', 'JournalEntry',
      'SalesReceipt', 'ReceivePayment', 'BillPayment', 'Estimate',
      'CreditMemo', 'VendorCredit', 'PurchaseOrder', 'Deposit', 'Transfer',
    ];
  }

  async queryTransactions(
    token: QBOToken,
    type: string,
    options?: { startDate?: string; endDate?: string; maxResults?: number }
  ): Promise<{ results: unknown[]; totalCount: number }> {
    let query = `SELECT * FROM ${type}`;
    const conditions: string[] = [];

    if (options?.startDate) {
      conditions.push(`MetaData.CreateTime >= '${options.startDate}'`);
    }
    if (options?.endDate) {
      conditions.push(`MetaData.CreateTime <= '${options.endDate}'`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    if (options?.maxResults) {
      query += ` MAXRESULTS ${options.maxResults}`;
    }

    const data = await this.apiRequest<{ QueryResponse: { [key: string]: unknown[]; totalCount: number } }>(
      token, 'GET', `/query?query=${encodeURIComponent(query)}`
    );

    const results = data.QueryResponse[type] || [];
    return { results, totalCount: data.QueryResponse.totalCount || results.length };
  }

  async importTransaction(
    token: QBOToken,
    type: string,
    transactionData: Record<string, unknown>
  ): Promise<{ id: string; status: string }> {
    const endpoint = TRANSACTION_ENDPOINTS[type];
    if (!endpoint) throw new Error(`Unsupported transaction type: ${type}`);

    const data = await this.apiRequest<{ [key: string]: { Id: string; status: string } }>(
      token, 'POST', endpoint, transactionData
    );

    const entity = Object.values(data)[0];
    return { id: entity.Id, status: entity.status };
  }

  async updateTransaction(
    token: QBOToken,
    type: string,
    id: string,
    transactionData: Record<string, unknown>,
    syncToken: string
  ): Promise<{ id: string; status: string }> {
    const endpoint = `${TRANSACTION_ENDPOINTS[type]}?operation=update`;
    const data = await this.apiRequest<{ [key: string]: { Id: string; status: string } }>(
      token, 'POST', endpoint, { ...transactionData, Id: id, SyncToken: syncToken }
    );

    const entity = Object.values(data)[0];
    return { id: entity.Id, status: entity.status };
  }

  async deleteTransaction(
    token: QBOToken,
    type: string,
    id: string,
    syncToken: string
  ): Promise<void> {
    const endpoint = `${TRANSACTION_ENDPOINTS[type]}?operation=delete`;
    await this.apiRequest(token, 'POST', endpoint, {
      Id: id,
      SyncToken: syncToken,
    });
  }

  async batchImport(
    token: QBOToken,
    transactions: ParsedTransaction[]
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      importedCount: 0,
      failedCount: 0,
      errors: [],
      qboIds: [],
    };

    for (const tx of transactions) {
      try {
        const mapped = this.mapToQBObject(tx);
        const resp = await this.importTransaction(token, tx.type, mapped);
        result.importedCount++;
        result.qboIds.push(resp.id);
      } catch (err) {
        result.failedCount++;
        result.errors.push({
          row: tx.rowNumber,
          message: err instanceof Error ? err.message : 'Unknown error',
          type: tx.type,
        });
      }
    }

    result.success = result.failedCount === 0;
    return result;
  }

  async batchDelete(
    token: QBOToken,
    items: Array<{ type: string; id: string; syncToken: string }>
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = { successCount: 0, failureCount: 0, results: [] };

    for (const item of items) {
      try {
        await this.deleteTransaction(token, item.type, item.id, item.syncToken);
        result.successCount++;
        result.results.push({ id: item.id, status: 'success' });
      } catch (err) {
        result.failureCount++;
        result.results.push({
          id: item.id,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  async batchUpdate(
    token: QBOToken,
    items: Array<{ type: string; id: string; syncToken: string; data: Record<string, unknown> }>
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = { successCount: 0, failureCount: 0, results: [] };

    for (const item of items) {
      try {
        await this.updateTransaction(token, item.type, item.id, item.data, item.syncToken);
        result.successCount++;
        result.results.push({ id: item.id, status: 'success' });
      } catch (err) {
        result.failureCount++;
        result.results.push({
          id: item.id,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  private mapToQBObject(tx: ParsedTransaction): Record<string, unknown> {
    const typeMap: Record<string, Record<string, unknown>> = {
      Invoice: {
        DocNumber: tx.fields['DocNumber'] || tx.fields['InvoiceNumber'],
        TxnDate: tx.fields['TxnDate'] || tx.fields['Date'],
        Line: [],
        CustomerRef: { name: tx.fields['CustomerName'] || tx.fields['Customer'] },
      },
      Bill: {
        DocNumber: tx.fields['DocNumber'] || tx.fields['BillNumber'],
        TxnDate: tx.fields['TxnDate'] || tx.fields['Date'],
        Line: [],
        VendorRef: { name: tx.fields['VendorName'] || tx.fields['Vendor'] },
      },
      Expense: {
        TxnDate: tx.fields['TxnDate'] || tx.fields['Date'],
        PaymentType: tx.fields['PaymentType'] || 'Cash',
        Line: [],
        AccountRef: { name: tx.fields['AccountName'] || tx.fields['Account'] },
      },
    };

    return typeMap[tx.type] || tx.fields;
  }
}

export const quickbooksService = new QuickBooksService();
