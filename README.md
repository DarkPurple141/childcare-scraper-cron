# Readme

## Getting started

Ensure `node` and a version of `chromium` is installed on your system.

The `node` binary is available here [https://nodejs.org/en/download/](https://nodejs.org/en/download/)

```bash
# to install dependencies
npm i
```

Assuming no errors, quick start running via:

```bash
npm start
```

This will begin the scraper

## Navigating the source

All source is written in typescript and is required to be
built by `tsc` to be run (or run `npm start`).

Logic is split out into three core tasks:

1. Parsing the postcodes of Australia (from `src/data/postcodes.json`)
2. Scraping the childcare finder website for childcares for each postcode (see `src/run-postcode.ts`)
3. Scraping each individual postcode for fee / contact information (see `src/run-centre.ts`)
