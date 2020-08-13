import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const totalIncome = await transactions.reduce(
      (acc: number, curr) => (curr.type === 'income' ? acc + curr.value : acc),
      0,
    );

    const totalOutcome = await transactions.reduce(
      (acc: number, curr) => (curr.type === 'outcome' ? acc + curr.value : acc),
      0,
    );

    const balance: Balance = {
      income: totalIncome,
      outcome: totalOutcome,
      total: totalIncome - totalOutcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
