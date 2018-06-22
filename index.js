const fs = require('mz/fs');
const Papa = require('papaparse');
const axios = require('axios');

const BUDGET_ID = '18b695c6-09e7-4fe2-8f59-8a8b6976f375';
const ACCOUNT_ID = 'bc363f3a-a2a2-4bc6-8372-596b881fd25b';
const BASE_URL = 'https://api.youneedabudget.com/v1';
const TRANSACTION_ENDPOINT = `/budgets/${BUDGET_ID}/transactions/bulk`;
const STUFF_I_FORGOT_TO_BUDGET_FOR = '1b6e07cf-5e09-4acf-9fbe-e5d43a74e815';
const IMMIDIATE_INCOME = '62e38839-ff0f-4812-a253-aef130da1691';

(async function () {
  try {
    const fileName = process.argv[2];
    const PAT = process.argv[3];
    const file = await fs.readFile(fileName, 'utf8');
    const startOfCsv = file.indexOf('Transaction Date');
    const ActualCsv = file.slice(startOfCsv, file.length - 1);
    const options = {
      header: true,
      trimHeaders: false,
      dynamicTyping: false,
      preview: 0,
      encoding: 'utf8',
      skipEmptyLines: true,
    };
    parsedCsv = Papa.parse(ActualCsv, options);
    const fields = parsedCsv.meta.fields;
    const transactions = parsedCsv.data.map(
      (data) => {
        const creditString = data[fields[5]].trim();
        const credit = Number(creditString);
        const debitString = data[fields[4]].trim();
        const debit = Number(debitString);
        const amount = Math.round((credit - debit) * 1000);
        const payeeName = data[fields[6]].trim();
        return {
          account_id: ACCOUNT_ID,
          date: data[fields[0]].trim(),
          amount,
          payee_name: payeeName,
          category_id: amount > 0 ? IMMIDIATE_INCOME : STUFF_I_FORGOT_TO_BUDGET_FOR,
          cleared: 'uncleared',
          approved: false,
          flag_color: 'blue',
        };
      }
    );

    const data = {
      budget_id: BUDGET_ID,
      transactions: transactions
    };
    const request = {
      method: 'post',
      url: `${BASE_URL}${TRANSACTION_ENDPOINT}`,
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      data
    };
    await axios(request);
    console.log('done!')
  } catch (e) {
    console.log(e);
  }
})();