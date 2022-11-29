const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");
const ULID = require('ulid')
require('dotenv').config()
const TWITTER_TABLE = process.env.DYNAMODB_TABLE;


const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

const app = express();
app.use(express.json());

app.post("/users", async (req, res) => {
    const { username, name } = req.body;
    if (typeof username !== "string") {
        res.status(400).json({ error: '"username" must be a string' });
    } else if (typeof name !== "string") {
        res.status(400).json({ error: '"name" must be a string' });
    }

    const userId = ULID.ulid()
    const item = {
        PK: `USER#${username}`,
        SK: `USER#${username}`,
        userId: userId,
        username: username,
        name: name,
        followerCount: 0,
        followingCount: 0
    }

    const params = {
        TableName: TWITTER_TABLE,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)"
    };


    try {
        const response = await dynamoDbClient.put(params).promise();
        delete item.PK
        delete item.SK
        res.json({ item });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not create user" });
    }
});

app.get("/users/:username", async (req, res) => {
    const params = {
        TableName: TWITTER_TABLE,
        Key: {
            PK: `USER#${req.params.username}`,
            SK: `USER#${req.params.username}`,
        },
    };
    try {
        const { Item } = await dynamoDbClient.get(params).promise();
        if (Item) {
            const { userId, username, name, followerCount, followingCount } = Item;
            res.json({ userId, username, name, followerCount, followingCount });
        } else {
            res
                .status(404)
                .json({ error: 'Could not find user with provided "username"' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not retreive user" });
    }
});

app.post("/users/:username/followers", async (req, res) => {
    const followingUser = req.body.followingUser;
    const followedUser = req.params.username
    if (typeof followingUser !== "string") {
        res.status(400).json({ error: '"followingUser" must be a string' });
    }

    const likeId = ULID.ulid()
    const item = {
        PK: `FOLLOW#${followedUser}`,
        SK: `FOLLOW#${followingUser}`,
        GSI1PK: `FOLLOW#${followedUser}`,
        GSI1SK: `FOLLOW#${followingUser}`,
        followedUsername: followedUser,
        followingUsername: followingUser,
    }

    const followedUserItem = {
        PK: `USER#${followedUser}`,
        SK: `USER#${followedUser}`,
    }

    const followingUserItem = {
        PK: `USER#${followingUser}`,
        SK: `USER#${followingUser}`,
    }

    const params = {
        TransactItems: [{
            Put: {
                TableName: TWITTER_TABLE,
                Item: item,
                ConditionExpression: "attribute_not_exists(PK)"
            },
        }, {
            Update: {
                TableName: TWITTER_TABLE,
                Key: followedUserItem,
                ConditionExpression: "attribute_exists(PK)",
                UpdateExpression: "SET #followerCount = #followerCount + :inc",
                ExpressionAttributeNames: {
                    "#followerCount": "followerCount"
                },
                ExpressionAttributeValues: {
                    ":inc": 1
                }
            }
        }, {
            Update: {
                TableName: TWITTER_TABLE,
                Key: followingUserItem,
                ConditionExpression: "attribute_exists(PK)",
                UpdateExpression: "SET #followingCount = #followingCount+ :inc",
                ExpressionAttributeNames: {
                    "#followingCount": "followingCount"
                },
                ExpressionAttributeValues: {
                    ":inc": 1
                }
            }
        }]

    };

    try {
        await dynamoDbClient.transactWrite(params).promise();
        delete item.PK
        delete item.SK
        delete item.GSI1PK
        delete item.GSI1SK
        res.json({ item });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not create like" });
    }
});

app.get("/users/:username/followers", async (req, res) => {
    const username = req.params.username
    try {
        const items = []
        const response = await dynamoDbClient.query({
            TableName: TWITTER_TABLE,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": `FOLLOW#${username}`
            },
            ScanIndexForward: false
        }).promise();
        response.Items.forEach((element, index) => {
            let el = {}
            el.followedUsername = element.followedUsername
            el.followingUsername = element.followingUsername
            items.push(el)
        })
        res.json({ items });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not retreive user followers" });
    }
});

app.get("/users/:username/following", async (req, res) => {
    const username = req.params.username
    try {
        const items = []
        const response = await dynamoDbClient.query({
            TableName: TWITTER_TABLE,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :gsi1pk",
            ExpressionAttributeValues: {
                ":gsi1pk": `FOLLOW#${username}`
            },
        }).promise();
        response.Items.forEach((element, index) => {
            let el = {}
            el.followedUsername = element.followedUsername
            el.followingUsername = element.followingUsername
            items.push(el)
        })
        res.json({ items });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not retreive user followers" });
    }
});


app.post("/tweet/:username", async (req, res) => {
    const { tweet } = req.body;
    const username = req.params.username
    if (typeof tweet !== "string") {
        res.status(400).json({ error: '"username" must be a string' });
    }

    const tweet_id = ULID.ulid()
    const item = {
        PK: `UT#${username}`,
        SK: `TWEET#${tweet_id}`,
        tweet: tweet,
        username: username,
        tweet_id: tweet_id,
        likesCount: 0,
        commentCount: 0,
        retweetCount: 0,
        quoteTweetCount: 0
    }

    const params = {
        TableName: TWITTER_TABLE,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)"
    };

    try {
        await dynamoDbClient.put(params).promise();
        delete item.PK
        delete item.SK
        res.json({ item });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not create user" });
    }
});

app.post("/tweet/:username/:tweet_id", async (req, res) => {
    const likingUsername = req.body.likingUsername;
    const username = req.params.username
    const tweet_id = req.params.tweet_id
    if (typeof likingUsername !== "string") {
        res.status(400).json({ error: '"likingUsername" must be a string' });
    }
    const likeId = ULID.ulid()
    const item = {
        PK: `TL#${tweet_id}`,
        SK: `LIKE#${likingUsername}`,
        GSI1PK: `TL#${tweet_id}`,
        GSI1SK: `LIKE#${likeId}`,
        likingUsername: likingUsername,
        username, username,
        tweet_id: tweet_id,
        likeId: likeId
    }

    const params = {
        TransactItems: [{
            Put: {
                TableName: TWITTER_TABLE,
                Item: item,
                ConditionExpression: "attribute_not_exists(PK)"
            },
        }, {
            Update: {
                TableName: TWITTER_TABLE,
                Key: {
                    PK: `UT#${username}`,
                    SK: `TWEET#${tweet_id}`
                },
                ConditionExpression: "attribute_exists(PK)",
                UpdateExpression: "SET #likesCount = #likesCount + :inc",
                ExpressionAttributeNames: {
                    "#likesCount": "likesCount"
                },
                ExpressionAttributeValues: {
                    ":inc": 1
                }
            }
        }]

    };

    try {
        await dynamoDbClient.transactWrite(params).promise();
        delete item.PK
        delete item.SK
        delete item.GSI1PK
        delete item.GSI1SK
        res.json({ item });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not create like" });
    }
});

app.get("/tweet/:tweet_id/likes", async (req, res) => {
    const tweet_id = req.params.tweet_id
    try {
        const items = []
        const response = await dynamoDbClient.query({

            TableName: TWITTER_TABLE,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :gsi1pk",
            ExpressionAttributeValues: {
                ":gsi1pk": `TL#${tweet_id}`
            },
            ScanIndexForward: false
        }).promise();

        response.Items.forEach((element, index) => {
            let el = {}
            el.likeId = element.likeId
            el.tweet_id = element.tweet_id
            el.likingUsername = element.likingUsername
            el.username = element.username
            items.push(el)
        })
        res.json({ items });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not retreive likes" });
    }
});

app.post("/tweet/:username/:tweet_id/comments", async (req, res) => {
    const { commentingUsername, content } = req.body;
    const username = req.params.username
    const tweet_id = req.params.tweet_id
    if (typeof commentingUsername !== "string") {
        res.status(400).json({ error: '"commentingUsername" must be a string' });
    }
    if (typeof content !== "string") {
        res.status(400).json({ error: '"content" must be a string' });
    }
    const commentId = ULID.ulid()
    const item = {
        PK: `TC#${tweet_id}`,
        SK: `COMMENT#${commentId}`,
        commentingUsername: commentingUsername,
        content: content,
        username, username,
        tweet_id: tweet_id,
        commentId: commentId
    }

    const params = {
        TransactItems: [{
            Put: {
                TableName: TWITTER_TABLE,
                Item: item,
                ConditionExpression: "attribute_not_exists(PK)"
            },
        }, {
            Update: {
                TableName: TWITTER_TABLE,
                Key: {
                    PK: `UT#${username}`,
                    SK: `TWEET#${tweet_id}`
                },
                ConditionExpression: "attribute_exists(PK)",
                UpdateExpression: "SET #commentCount = #commentCount + :inc",
                ExpressionAttributeNames: {
                    "#commentCount": "commentCount"
                },
                ExpressionAttributeValues: {
                    ":inc": 1
                }
            }
        }]

    };

    try {
        await dynamoDbClient.transactWrite(params).promise();
        delete item.PK
        delete item.SK
        res.json({ item });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not create like" });
    }
});


app.get("/tweet/:tweet_id/comments", async (req, res) => {
    const tweet_id = req.params.tweet_id
    try {
        const items = []
        const response = await dynamoDbClient.query({

            TableName: TWITTER_TABLE,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": `TC#${tweet_id}`
            },
            ScanIndexForward: false
        }).promise();
        response.Items.forEach((element, index) => {
            let el = {}
            el.commentId = element.commentId
            el.tweet_id = element.tweet_id
            el.commentingUsername = element.commentingUsername
            el.content = element.content
            el.username = element.username
            items.push(el)
        })
        res.json({ items });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not retreive likes" });
    }
});




app.use((req, res, next) => {
    return res.status(404).json({
        error: "Not Found",
    });
});

// dev
// const port = process.env.PORT || 3000
// app.listen(port, () => {
//     console.log('listening on port ' + port)
// })
// dev

//prod
module.exports.handler = serverless(app);
//prod