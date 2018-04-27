require('newrelic')

const client = require('./config/redis')
const models = require('./models')
const sequelize = require('sequelize')

async function flushTweets() {
  console.log('running cron job')

  try {
    var tweets = await client.lrangeAsync('writer', 0, 100)
    if (!tweets) {
      return
    }
    client.ltrim('writer', 1, tweets.length)
    if (tweets && tweets.length > 0) {
      tweets = tweets.map(tweet => JSON.parse(tweet))

      models.Tweet.bulkCreate(tweets, { returning: true });

      for (var i = 0; i < tweets.length; ++i) {
        models.User.update(
            { numTweets: sequelize.literal(`"Users"."numTweets" + 1`) },
            { where: { id: tweets[i].user.id }
        });
      }
      process.exit();
    }
  } catch (e) {
    console.log(e)
  }

}

flushTweets();
