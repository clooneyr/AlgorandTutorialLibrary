# Algorand Developer Environment Setup

### _Prerequisites:_
- Python3
- Pip3
- Node package manager i.e NPM or Yarn
- Docker & docker-compose.
---

## Pyteal Install

```
pip3 install pyteal
```

### Smartcontract Creation
1. Filetype = .py
2. from pyteal import *

### Compile Smartcontract
```
python <filename>
```

## JS Development Environment

1. Install JS SDK

```
$ npm install algosdk
```

2. Load Sandbox into repository

```
git clone https://github.com/algorand/sandbox.git
```

3. Start up Algorand TestNet

```
cd sandbox
./sandbox up testnet
```
_To shut down testnet run ./sandbox down_

4. Run JS script

```
node <filenmame.js>
```
