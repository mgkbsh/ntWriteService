require('newrelic')

const express = require('express');
const app = express();
const port = process.env.PORT || 7000;

const client = require('./config/redis')
const models = require('./models')
const sequelize = require('sequelize')

var CronJob = require('cron').CronJob;
var job = new CronJob('* * * * *', async () => {
  console.log('running cron job')

  try {
    var tweets = await client.lrangeAsync('writer', 0, 100)
    client.ltrim('writer', 0, 100)
    if (tweets && tweets.length > 0) {
      tweets = tweets.map(tweet => JSON.parse(tweet))

      await models.Tweet.bulkCreate(tweets, { returning: true })
      .then(users => {
        for (user in users) {
          models.User.update(
              { numTweets: sequelize.literal(`"Users"."numTweets" + 1`) },
              { where: { id: user.id }
          });
        }

      });
      console.log('success')
    }
  } catch (e) {
    console.log(e)
  }

  }, null,
  true, /* Start the job right now */
  'America/Los_Angeles' /* Time zone of this job. */
);

app.listen(port);
