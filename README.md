# commerceml-parser

Status: Work In Progress

## Description

Parser for CommerceML 2.10 standard developed by 1c.ru.

Standard description: https://v8.1c.ru/tekhnologii/obmen-dannymi-i-integratsiya/standarty-i-formaty/standarty-commerceml/commerceml-2/

## Features

* Types description in English
* SAX XML parser suitable for large files
* NodeJS
* TypeScript
* [xojs/xo](https://github.com/xojs/xo) with plugins for TypeScript - linting in CLI
* [ESLint](https://github.com/eslint/eslint) - linting in the WebStorm with [ESLint plugin](https://plugins.jetbrains.com/plugin/7494-eslint)
* [jasmine](https://github.com/jasmine/jasmine) - Testing
* [nyc](https://github.com/istanbuljs/nyc) - Code Coverage

## Installation

```
npm install --save commerceml-parser
```

## Usage

Have a look at usage examples in tests `/spec/example.spec.ts`.

Run example: `npm run example`

Here is a common usage example:

```typescript
import {CommerceMlImportParser} from 'commerceml-parser/import-parser';
import {createReadStream} from "fs";

// Create parser for CommerceML catalog import file
const catalogImportParser = new CommerceMlImportParser();

// Define handler for classifier XML block
catalogImportParser.onClassifier(classifier => {
  console.log('classifier', JSON.stringify(classifier));
});


// Define handler for classifier group XML blocks
catalogImportParser.onClassifierGroup(classifierGroup => {
  console.log('classifierGroup', JSON.stringify(classifierGroup));
});

// Read CommerceML file and feed it to the parser stream
await catalogImportParser.parse(createReadStream('./data/import0_1_with_nested_groups.xml'));
``` 

## Thanks to

@kirill-zhirnov for his commerceml-js parser written in CoffeeScript.

## License

MIT (c) 2020 Viacheslav Dobromyslov <<viacheslav@dobromyslov.ru>>
