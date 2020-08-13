import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateCategoryService from './CreateCategoryService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (!title) {
      throw new AppError('A title must be provided.');
    }

    if (!value || value <= 0) {
      throw new AppError('Value must be provided and should be > 0.');
    }

    if (!type || (type !== 'income' && type !== 'outcome')) {
      throw new AppError('Type should be either Income or Outcome.');
    }

    if (!category) {
      throw new AppError('Category must be provided.');
    }

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError(
        'Invalid transaction: your balance would be negative.',
      );
    }

    const categoryEntity = await new CreateCategoryService().execute({
      title: category,
    });

    const transaction = await transactionsRepository.save(
      transactionsRepository.create({
        title,
        value,
        type,
        category: categoryEntity,
      }),
    );

    delete transaction.category_id;

    return transaction;
  }
}

export default CreateTransactionService;
