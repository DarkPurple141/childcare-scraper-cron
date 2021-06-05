const data = require('./raw.json')

const { Parser } = require('json2csv');

try {
  const parser = new Parser();
  const csv = parser.parse(data.map(({ fees,...d}) => ({
    ...d,
    ...Object.keys(fees || {}).map(key => {

      if (key === 'Last updated') {
        return {
          [key]: fees[key],
        }
      }

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