import { accountApi } from '../../api/accounts';
import type { Account, AccountFormData } from '../../types/accounts';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../services/api';

describe('accountApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getAccounts returns accounts array', async () => {
    const mockAccounts: Account[] = [
      { id: '1', user: 'u', name: 'A', type: 'BANK', currency: {} as any, initial_balance: 1, current_balance: 1, base_currency_balance: 1, is_active: true, created_at: '', updated_at: '' },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: mockAccounts });
    const result = await accountApi.getAccounts();
    expect(api.get).toHaveBeenCalledWith('/accounts');
    expect(result).toEqual(mockAccounts);
  });

  it('getAccount returns a single account', async () => {
    const mockAccount: Account = { id: '1', user: 'u', name: 'A', type: 'BANK', currency: {} as any, initial_balance: 1, current_balance: 1, base_currency_balance: 1, is_active: true, created_at: '', updated_at: '' };
    (api.get as jest.Mock).mockResolvedValue({ data: mockAccount });
    const result = await accountApi.getAccount('1');
    expect(api.get).toHaveBeenCalledWith('/accounts/1/');
    expect(result).toEqual(mockAccount);
  });

  it('createAccount posts and returns the new account', async () => {
    const form: AccountFormData = { name: 'A', type: 'BANK', currency_id: 'c', initial_balance: 1 };
    const mockAccount: Account = { id: '1', user: 'u', name: 'A', type: 'BANK', currency: {} as any, initial_balance: 1, current_balance: 1, base_currency_balance: 1, is_active: true, created_at: '', updated_at: '' };
    (api.post as jest.Mock).mockResolvedValue({ data: mockAccount });
    const result = await accountApi.createAccount(form);
    expect(api.post).toHaveBeenCalledWith('/accounts', form);
    expect(result).toEqual(mockAccount);
  });

  it('updateAccount puts and returns the updated account', async () => {
    const form: Partial<AccountFormData> = { name: 'B' };
    const mockAccount: Account = { id: '1', user: 'u', name: 'B', type: 'BANK', currency: {} as any, initial_balance: 1, current_balance: 1, base_currency_balance: 1, is_active: true, created_at: '', updated_at: '' };
    (api.put as jest.Mock).mockResolvedValue({ data: mockAccount });
    const result = await accountApi.updateAccount('1', form);
    expect(api.put).toHaveBeenCalledWith('/accounts/1/', form);
    expect(result).toEqual(mockAccount);
  });

  it('deleteAccount calls delete', async () => {
    (api.delete as jest.Mock).mockResolvedValue({});
    await accountApi.deleteAccount('1');
    expect(api.delete).toHaveBeenCalledWith('/accounts/1/');
  });
}); 