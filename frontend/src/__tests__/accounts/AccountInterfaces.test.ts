import { expect, test } from '@jest/globals';
import type { Account } from '../../types/accounts';

const sampleAccount: Account = {
  id: 'uuid-123',
  user: 'user-uuid',
  name: 'Test Account',
  type: 'BANK',
  currency: {
    id: 'currency-uuid',
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimal_places: 2,
    is_base_currency: false,
    exchange_rate: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  initial_balance: 1000,
  current_balance: 1000,
  base_currency_balance: 1000,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

test('Account object matches expected shape', () => {
  expect(sampleAccount).toMatchObject({
    id: expect.any(String),
    user: expect.any(String),
    name: expect.any(String),
    type: expect.any(String),
    currency: expect.objectContaining({
      id: expect.any(String),
      code: expect.any(String),
      name: expect.any(String),
      symbol: expect.any(String),
      decimal_places: expect.any(Number),
      is_base_currency: expect.any(Boolean),
      exchange_rate: expect.any(Number),
      is_active: expect.any(Boolean),
      created_at: expect.any(String),
      updated_at: expect.any(String),
    }),
    initial_balance: expect.any(Number),
    current_balance: expect.any(Number),
    base_currency_balance: expect.any(Number),
    is_active: expect.any(Boolean),
    created_at: expect.any(String),
    updated_at: expect.any(String),
  });
}); 