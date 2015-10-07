__author__ = 'feliperc'
# -*- coding: utf-8 -*-
# -*- coding: iso-8859-15 -*-


#******************************************************************************
# Imports
#******************************************************************************

import logging
import webapp2
from lib.tweepy import Stream
from lib.tweepy import OAuthHandler
from lib.tweepy.streaming import StreamListener
#import MySQLdb
import time
import json
from settings import gcp_config
import lib.twitter
from google.appengine.api import taskqueue
import models
from lib.TwitterSearch import *

#conn = MySQLdb.connect(host=gcp_config.CLOUD_SQL_IP_INSTANCE, port=3306, db=gcp_config.DATABASE_NAME, user=gcp_config.DB_USER_NAME, passwd=gcp_config.DB_PASSWORD, charset='utf8')

#c = conn.cursor()


#consumer key, consumer secret, access token, access secret.
ckey="VHqwi1VO1Wt4tb4GyODMPjEU8"
csecret="bukSNixBhjZOUDcIF3WOL6MX99APCz8d7UnafAoqLaXZjgoVyw"
atoken="95411550-TxmGWzBrNqw9G6n5T4aGqSw0Kjsj6rL2ZOJ3EHVQe"
asecret="DmzxsH1krV8dfrVtpN3bSdeJaZKva43efdWjmVaGTwqZQ"

#******************************************************************************
# SocialPromo Handler
#******************************************************************************

# url sample http://atlantean-force-90113.appspot.com/rest/SocialPromoQueue?campaignId=C9

class SocialPromoQueue(webapp2.RequestHandler):
  def get(self):
    logging.info('Start queue')

    campaignId = self.request.get('campaignId')

    #Creating a queue and put the data on the task
    queue = taskqueue.Queue(name='jobs')
    task = taskqueue.Task(url = '/rest/SocialPromoWorker', method="GET", params={'campaignId': campaignId})
    queue.add(task)


class SocialPromoWorker(webapp2.RequestHandler):
  def get(self):
    logging.getLogger().setLevel(logging.DEBUG)
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.headers['charset'] = 'utf-8'

    #try:

    logging.info('Starting')

    #twitter_api = twitter.Api(consumer_key=ckey, consumer_secret=csecret, access_token_key=atoken, access_token_secret=asecret, cache=None)

    #auth = OAuthHandler(ckey, csecret)
    #auth.set_access_token(atoken, asecret)

    #HASHTAG = '#citnagt'

    logging.info('Calling stream')

    campaignId = self.request.get('campaignId')

    hashTags = self.getCampaignHashTag(campaignId)

    twitterListener = listenerTwitterSearch()
    twitterListener.getTweets(campaignId, hashTags)

    #twitterStream = Stream(auth, listener(),timeout=60,secure=False)
    #twitterStream.filter(track=[HASHTAG])

    #i=0
    #while (i < 100):
    #    self.SaveToDataStore("felipe","testando..." + str(i))
    #    i=i+1

    logging.info('Finished stream')

    # except Exception, e:
    #     logging.error('Error:' + str(e))
    #     self.response.write('\n\nError: %s ' % str(e))
    # else:
    #     msg = '\n\nProcess ran successfully!\n'
    #     logging.info(msg)
    #     self.response.write(msg)

  def getCampaignHashTag(self, campaignId):

    hashTags = ''

    logging.getLogger().setLevel(logging.DEBUG)

    logging.info('Get campaign hashtag')

    logging.info("c=" + campaignId)

    campaign_values = models.Campaign.query()

    camp = campaign_values.filter(models.Campaign.campaignId == str(campaignId))

    for c in camp:
       logging.info('Encontrei=' + str(c.hashTags))
       hashTags = str(c.hashTags)


    logging.info(hashTags)
    logging.info('Finished')

    return  hashTags


#******************************************************************************
# Twitter Listener (twitterSearch)
#******************************************************************************
class listenerTwitterSearch():
    def getTweets(self,campaignId, hashTags):
        try:
            tso = TwitterSearchOrder() # create a TwitterSearchOrder object
            tso.set_keywords([hashTags]) # let's define all words we would like to have a look for
            #tso.set_language('de') # we want to see German tweets only
            tso.set_include_entities(False) # and don't give us all those entity information

            # it's about time to create a TwitterSearch object with our secret tokens
            ts = TwitterSearch(
                consumer_key = ckey,
                consumer_secret = csecret,
                access_token = atoken,
                access_token_secret = asecret
             )

             # this is where the fun actually starts :)
            for tweet in ts.search_tweets_iterable(tso):
                logging.info( '@%s tweeted: %s' % (tweet['user']['screen_name'], tweet['text']))

                self.SaveToDataStore(campaignId, tweet['user']['screen_name'], tweet['text'])

        except TwitterSearchException as e: # take care of all those ugly errors if there are some
            logging.error(str(e))

    def SaveToDataStore(self, campaignId, username,tweetText):
        logging.info('Save to dataStore')

        tweet = models.Tweet()
        tweet.text = tweetText
        tweet.userName = username
        tweet.campaignId = campaignId

        tweet.put()


#******************************************************************************
# Twitter Listener (tweepy)
#******************************************************************************
class listener(StreamListener):

    def on_data(self, data):
        logging.info('On data..................................')

        all_data = json.loads(data)

        tweet = all_data["text"]

        username = all_data["user"]["screen_name"]

        print((username,tweet))

        try:
            self.SaveToCloudSQL(username, tweet)

        except Exception, e:
            print('Error:' + str(e))

        return True

    def on_error(self, status):
        logging.info(status);
        return True

    def on_error(self, status_code):
        logging.info('Encountered error with status code:' + status_code);
        return True # Don't kill the stream

    def on_timeout(self):
        logging.info('Time out');
        return True # Don't kill the stream

    def SaveToCloudSQL(self, username, tweet):
        logging.info('Saving on cloud sql');

        if (os.getenv('SERVER_SOFTWARE') and
          os.getenv('SERVER_SOFTWARE').startswith('Google App Engine/')):
          db = MySQLdb.connect(
          unix_socket='/cloudsql/' + gcp_config.MYSQL_INSTANCE_NAME,
          user='root')
        else:
            db = MySQLdb.connect(host=gcp_config.CLOUD_SQL_IP_INSTANCE, port=3306, db=gcp_config.DATABASE_NAME, user=gcp_config.DB_USER_NAME, passwd=gcp_config.DB_PASSWORD, charset='utf8')

        cursorTweets = db.cursor()

        try:

            sql = 'INSERT INTO TB_TWEET (time, username, tweet) VALUES ("%s","%s","%s")' % (time.time(), username, tweet)

            logging.info(sql)

            db.execute(sql)

            db.commit()

        except Exception, e:
            logging.error(str(e))

        db.close()


