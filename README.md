# Node Express Serverless DynamoDB - Twitter Api

_This project was build for Builtamart assessment_

You may also refer to this documents for other details

- [Builtamart Google Sheet](https://docs.google.com/spreadsheets/d/11Ii0OUcdmKHxDnjRVQd73rZaqtfFfg-VSx-fzuWvq7U/edit#gid=1946939777)

## Usage

To deploy this project, run the following commands in your terminal:

```bash
git clone https://github.com/adrianpura/node-express-dynamodb.git && cd node-express-dynamodb
npm i
sls deploy
```

```bash
endpoints:
  POST - https://p2i37ksl2c.execute-api.ap-southeast-1.amazonaws.com/users - creates a user
  GET - https://p2i37ksl2c.execute-api.ap-southeast-1.amazonaws.com/users/{username} - get user by username
  POST - https://p2i37ksl2c.execute-api.ap-southeast-1.amazonaws.com/users/{username}/followers - follow a user
  GET - https://p2i37ksl2c.execute-api.ap-southeast-1.amazonaws.com/users/{username}/followers - get user followers
  GET - https://p2i37ksl2c.execute-api.ap-southeast-1.amazonaws.com/users/{username}/following - get followed by user
  POST - https://p2i37ksl2c.execute-api.ap-southeast-1.amazonaws.com/tweet/{username} - create a tweet
  POST - https://p2i37ksl2c.execute-api.ap-southeast-1.amazonaws.com/tweet/{username}/{tweet_id} - like a tweet
  GET - https://p2i37ksl2c.execute-api.ap-southeast-1.amazonaws.com/tweet/{tweet_id}/likes - get tweet likes
  POST - https://p2i37ksl2c.execute-api.ap-southeast-1.amazonaws.com/tweet/{username}/{tweet_id}/comments - comment on tweet
  GET - https://p2i37ksl2c.execute-api.ap-southeast-1.amazonaws.com/tweet/{tweet_id}/comments - get tweet comments
```
