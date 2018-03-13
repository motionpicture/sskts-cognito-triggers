process.env.PATH = `${process.env.PATH}: ${process.env.LAMBDA_TASK_ROOT}`;

import * as pecorino from '@motionpicture/pecorino-domain';
import * as AWS from 'aws-sdk';

import mongooseConnectionOptions from './mongooseConnectionOptions';

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
export const handler = async (event: any, context: any) => {
    // This Lambda function returns a flag to indicate if a user should be auto-confirmed.

    // Perform any necessary validations.

    // Pecorino口座作成
    try {
        const INITIAL_BALANCE = (process.env.INITIAL_BALANCE !== undefined) ? parseInt(process.env.INITIAL_BALANCE, 10) : 0;
        await pecorino.mongoose.connect(<string>process.env.MONGOLAB_URI, mongooseConnectionOptions)
        const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
        const account = await pecorino.service.account.openIfNotExists({
            id: `sskts-${event.userName}`,
            name: `${event.request.userAttributes.family_name} ${event.request.userAttributes.given_name}`,
            initialBalance: INITIAL_BALANCE
        })({ account: accountRepo });

        await pecorino.mongoose.disconnect();

        const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
            apiVersion: 'latest',
            region: 'ap-northeast-1'
        });

        cognitoIdentityServiceProvider.adminUpdateUserAttributes(
            {
                UserPoolId: event.userPoolId,
                Username: event.userName,
                UserAttributes: [
                    {
                        Name: 'custom:pecorinoAccountId',
                        Value: account.id
                    }
                ]
            },
            (err) => {
                if (err instanceof Error) {
                    context.done(err, event);
                } else {
                    // Return result to Cognito
                    context.done(null, event);
                }
            });

    } catch (error) {
        context.done(error, event);
    }
};