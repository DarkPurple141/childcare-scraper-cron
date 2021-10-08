"use strict";
(() => {
var exports = {};
exports.id = 335;
exports.ids = [335];
exports.modules = {

/***/ 421:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ handler)
});

;// CONCATENATED MODULE: ./src/constants.ts
const BASE_URL = 'https://www.childcarefinder.gov.au';
const AWS_POSTCODE_SQS_URL = 'https://sqs.ap-southeast-2.amazonaws.com/217357644508/PostCodeDispatchQueue';
const URL_REGEX = /https:\/\/www\.childcarefinder\.gov\.au\/service\/\w+\/(\w+)\/([\w\+]+)/;
;// CONCATENATED MODULE: ./src/run-postcode.ts
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



/**
 * Generates the list of ids / urls of childcare centres for a specified postcode
 *
 * @param page
 * @param locality
 * @returns
 */
async function runPostcode(page, locality) {
  const url = `${BASE_URL}/search/${locality.state}/${locality.postcode}/${locality.id}`;
  await page.goto(url, {
    waitUntil: 'networkidle2'
  });
  const returnVal = [];

  while (1) {
    const content = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.result__box')).filter(Boolean).map(node => {
        // this is the most unsafe, but more or less guaranteed to be
        // on the page
        // TODO remove non-null assertions
        const titleNode = node.querySelector('h2');
        const title = titleNode.querySelector('a').textContent.trim();
        const id = titleNode.id;
        const link = node.querySelector('a[title="Organisation Details"]').getAttribute('href');
        return {
          title,
          id,
          link
        };
      });
    }); // append results

    returnVal.push(...content.map(item => _objectSpread(_objectSpread({}, item), {}, {
      state: locality.state,
      suburb: locality.suburb,
      postcode: locality.postcode
    }))); // click next arrow item, as long as not disabled

    const next = await page.$('a[title="Next"] i.icon-arrow-right'); // can occur for non paginated results

    if (!next) {
      break;
    } // if we've toggled through all pages the last arrow should be disabled


    const isLast = await next.evaluate(node => {
      return node.closest('a').classList.contains('arrow-disabled');
    });

    if (isLast) {
      break;
    }

    await next.click();
  }

  return returnVal;
}
;// CONCATENATED MODULE: external "winston"
const external_winston_namespaceObject = require("winston");
var external_winston_default = /*#__PURE__*/__webpack_require__.n(external_winston_namespaceObject);
;// CONCATENATED MODULE: ./src/logger.ts
 // configures logging output to console

const consoleOutput = new (external_winston_default()).transports.Console({
  format: external_winston_namespaceObject.format.combine(external_winston_namespaceObject.format.colorize(), external_winston_namespaceObject.format.simple())
});
external_winston_default().add(consoleOutput);
external_winston_default().add(new (external_winston_default()).transports.File({
  filename: 'combined.log'
}));

;// CONCATENATED MODULE: external "path"
const external_path_namespaceObject = require("path");
;// CONCATENATED MODULE: ./src/utils.ts



/**
 * @example
 * 'str' => 'Str'
 * 'str str' => 'Str Str'
 * @param str generic string
 */
function toTitleCase(str) {
  return str.replace(/\+/g, ' ').replace(/(^|\s)\S/g, function (t) {
    return t.toUpperCase();
  });
}
function getMemoryUsage() {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  return `[Memory] The script is using approximately ${Math.round(used * 100) / 100} MB`;
}
function simplifyLocality({
  locality,
  postcode,
  state
}) {
  return {
    suburb: toTitleCase(locality.toLowerCase()),
    postcode,
    state: state.toLowerCase(),
    id: locality.toLowerCase()
  };
}
/**
 * @param b        The Puppeteer browser instance
 * @param callback User provided callback to be safely passed the page instance
 * @returns        Dependent on the callback
 */

async function getPageSafely(browser, callback) {
  const p = await browser.newPage();

  try {
    return callback(p);
  } catch (e) {
    // errors here should only occur if the callback fails
    logger.warn(`Error getting data for ${p.url()}`, e);
    await p.screenshot({
      fullPage: true,
      path: path.join(__dirname, `../errors/${p.url().split('/').join('-')}.png`)
    });
  } finally {
    await p.close();
  }
}
;// CONCATENATED MODULE: external "puppeteer"
const external_puppeteer_namespaceObject = require("puppeteer");
;// CONCATENATED MODULE: ./pages/api/postcode.ts



async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const {
        authorization
      } = req.headers;

      if (authorization === `Bearer ${process.env.API_SECRET_KEY}`) {
        const browser = await (0,external_puppeteer_namespaceObject.launch)({
          headless: true
        });
        const page = await browser.newPage();
        const data = await runPostcode(page, simplifyLocality({
          id: 4497,
          postcode: '2010',
          locality: 'DARLINGHURST',
          state: 'NSW',
          long: 151.212262,
          lat: -33.884119,
          dc: 'WATERLOO DELIVERY FACILITY',
          type: 'Delivery Area',
          status: 'Updated 6-Feb-2020',
          sa3: '11703',
          sa3name: 'Sydney Inner City',
          sa4: '117',
          sa4name: 'Sydney - City and Inner South',
          region: 'R1'
        }));
        res.status(200).json(data);
      } else {
        res.status(401).json({
          success: false
        });
      }
    } catch (err) {
      res.status(500).json({
        statusCode: 500,
        message: err.message
      });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__(421));
module.exports = __webpack_exports__;

})();