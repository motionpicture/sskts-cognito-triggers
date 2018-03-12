"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.PATH = `${process.env.PATH}: ${process.env.LAMBDA_TASK_ROOT}`;
const pecorino = require("@motionpicture/pecorino-domain");
const mongooseConnectionOptions_1 = require("./mongooseConnectionOptions");
/**
 * サインアップ前のトリガー
 * eventのサンプル
 * {
  "version": 1,
  "triggerSource": "PreSignUp_SignUp",
  "region": "<region>",
  "userPoolId": "<userPoolId>",
  "userName": "<userName>",
  "callerContext": {
      "awsSdk": "<calling aws sdk with version>",
      "clientId": "<apps client id>",
      ...
  },
  "request": {
      "userAttributes": {
          "email": "<email>",
          "phone_number": "<phone_number>",
          ...
       },
      "validationData": {
          "k1": "v1",
          "k2": "v2",
          ...
       }
  },
  "response": {
      "autoConfirmUser": false
  }
}
 */
exports.handler = (event, context) => __awaiter(this, void 0, void 0, function* () {
    // This Lambda function returns a flag to indicate if a user should be auto-confirmed.
    // Perform any necessary validations.
    // Pecorino口座作成
    const INITIAL_BALANCE = (process.env.INITIAL_BALANCE !== undefined) ? parseInt(process.env.INITIAL_BALANCE, 10) : 0;
    yield pecorino.mongoose.connect(process.env.MONGOLAB_URI, mongooseConnectionOptions_1.default);
    const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
    yield pecorino.service.account.open({
        id: `${event.userName}`,
        name: `${event.request.userAttributes.family_name} ${event.request.userAttributes.given_name}`,
        initialBalance: INITIAL_BALANCE
    })({ account: accountRepo });
    // Impose a condition that the minimum length of the username of 5 is imposed on all user pools.
    // if (event.userName.length < 5) {
    //     var error = new Error('failed!');
    //     context.done(error, event);
    // }
    // Access your resource which contains the list of emails of users who were invited to sign up
    // Compare the list of email IDs from the request to the approved list
    // if (event.userPoolId === "yourSpecialUserPool") {
    //     if (event.request.userAttributes.email in listOfEmailsInvited) {
    //         event.response.autoConfirmUser = true;
    //     }
    // }
    // Return result to Cognito
    context.done(null, event);
});
