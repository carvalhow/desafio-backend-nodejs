import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository, getCustomRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  fileName: string;
}

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ fileName }: Request): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', fileName);
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    try {
      parseCSV.on('data', line => {
        const [title, type, value, category] = line.map((cell: string) =>
          cell.trim(),
        );

        if (!title || !type || !value) return;

        categories.push(category);
        transactions.push({ title, type, value, category });
      });

      await new Promise(resolve => parseCSV.on('end', resolve));

      const existentCategories = await categoriesRepository.find({
        where: {
          title: In(categories),
        },
      });

      const existentCategoriesTitles = existentCategories.map(
        (cat: Category) => cat.title,
      );

      const addCategoryTitles = categories
        .filter(category => !existentCategoriesTitles.includes(category))
        .filter((value, index, self) => self.indexOf(value) === index);

      const newCategories = categoriesRepository.create(
        addCategoryTitles.map(title => ({
          title,
        })),
      );

      await categoriesRepository.save(newCategories);

      const allCategories = [...newCategories, ...existentCategories];

      const createdTransactions = transactionsRepository.create(
        transactions.map(transaction => ({
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category: allCategories.find(
            category => category.title === transaction.category,
          ),
        })),
      );

      await transactionsRepository.save(createdTransactions);

      return createdTransactions;
    } catch (err) {
      throw new AppError(err);
    } finally {
      await fs.promises.unlink(csvFilePath);
    }
  }
}

export default ImportTransactionsService;
