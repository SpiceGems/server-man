/* ഓം ബ്രഹ്മാർപ്പണം. */

/*
 * src/AuthKeyLine.js
 * Created: Wed Aug 23 2017 13:15:44 GMT+0530 (IST)
 * Copyright 2017 Harish.K<harish2704@gmail.com>
 */

class AuthKeyLine{
  constructor( line , lineNo ){
    const match = line.match(/ *(\S*) (\S*)(.*)/) || [];
    this.fullLine = line;
    this.id = match[ 2 ];
    this.rsa = match[ 1 ];
    this.name = match[ 3 ];
    this.lineNo = lineNo;
  }

  static create( line, lineNo ){
    return new AuthKeyLine( line, lineNo );
  }

  toString(){
    return this.fullLine;
  }
}

module.exports  = AuthKeyLine;
