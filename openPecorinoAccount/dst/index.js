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
const AWS = require("aws-sdk");
const mongooseConnectionOptions_1 = require("./mongooseConnectionOptions");
/**
 * ユーザー本人確認後のトリガー
 * eventのサンプル
 * {
  "version": 1,
  "triggerSource": "PostConfirmation_ConfirmSignUp",
  "region": "<region>",
  "userPoolId": "<userPoolId>",
  "userName": "<userName>",
  "callerContext": {
      "awsSdk": "<calling aws sdk with version>",
      "clientId": "<apps client id>",
      ...
  },
  "request": {
      "userAttributes" : {
          "email": "<email>",
          "phone_number": "<phone_number>",
          ...
      }
  },
  "response": {}
}
 */
exports.handler = (event, context) => __awaiter(this, void 0, void 0, function* () {
    // This Lambda function returns a flag to indicate if a user should be auto-confirmed.
    // Perform any necessary validations.
    // Pecorino口座作成
    try {
        const INITIAL_BALANCE = (process.env.INITIAL_BALANCE !== undefined) ? parseInt(process.env.INITIAL_BALANCE, 10) : 0;
        yield pecorino.mongoose.connect(process.env.MONGOLAB_URI, mongooseConnectionOptions_1.default);
        const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
        const account = yield pecorino.service.account.openIfNotExists({
            id: `sskts-${event.userName}`,
            name: `${event.request.userAttributes.family_name} ${event.request.userAttributes.given_name}`,
            initialBalance: INITIAL_BALANCE
        })({ account: accountRepo });
        yield pecorino.mongoose.disconnect();
        const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
            apiVersion: 'latest',
            region: 'ap-northeast-1'
        });
        cognitoIdentityServiceProvider.adminUpdateUserAttributes({
            UserPoolId: event.userPoolId,
            Username: event.userName,
            UserAttributes: [
                {
                    Name: 'custom:pecorinoAccountId',
                    Value: account.id
                }
            ]
        }, (err) => {
            if (err instanceof Error) {
                context.done(err, event);
            }
            else {
                // Return result to Cognito
                context.done(null, event);
            }
        });
    }
    catch (error) {
        context.done(error, event);
    }
});
