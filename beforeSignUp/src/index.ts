process.env.PATH = `${process.env.PATH}: ${process.env.LAMBDA_TASK_ROOT}`;

import * as pecorino from '@motionpicture/pecorino-domain';

import mongooseConnectionOptions from './mongooseConnectionOptions';

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
export const handler = async (event: any, context: any) => {
    // This Lambda function returns a flag to indicate if a user should be auto-confirmed.

    // Perform any necessary validations.

    // Pecorino口座作成
    const INITIAL_BALANCE = (process.env.INITIAL_BALANCE !== undefined) ? parseInt(process.env.INITIAL_BALANCE, 10) : 0;
    await pecorino.mongoose.connect(<string>process.env.MONGOLAB_URI, mongooseConnectionOptions)
    const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
    await pecorino.service.account.open({
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
};