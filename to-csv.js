const data = require('./data.json')

const { Parser } = require('json2csv');

try {
  const parser = new Parser();
  const csv = parser.parse(data.map(({ fees,...d}) => ({
    ...d,
    ...Object.keys(fees).map(key => {
      return Object.entries(fees[key]).reduce((acc, [deepkey, value]) => ({
        ...acc,
        [`${key}-${deepkey}`]: value
      }), {})
    }).reduce((acc, curr) => ({
      ...acc,
      ...curr,
    }), {})
  })));
  console.log(csv);
} catch (err) {
  console.error(err);
}