import { getCustomRepository } from 'typeorm';
import { validate } from 'uuid';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    if (!validate(id)) {
      throw new AppError('Provided ID does not match a valid format.');
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transaction = transactionsRepository.find({ where: { id } });

    if (!transaction) {
      throw new AppError('Transaction not found');
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
