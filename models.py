__author__ = 'feliperc'

from google.appengine.ext import ndb


class Tweet(ndb.Model):
    campaignId = ndb.StringProperty()
    status = ndb.DateProperty()
    twitterId = ndb.StringProperty()
    userName = ndb.StringProperty()
    createdAt = ndb.DateProperty(indexed=False)
    loadedAt = ndb.DateProperty(indexed=False)
    text = ndb.StringProperty(indexed=False)


class TwitterUser(ndb.Model):
    userId = ndb.StringProperty()
    userName = ndb.StringProperty()
    userLocation = ndb.StringProperty()
    followersCount = ndb.StringProperty(indexed=False)


class TwitterReply(ndb.Model):
    id = ndb.StringProperty()
    tweetId = ndb.StringProperty()
    createdAt = ndb.DateProperty()
    text = ndb.StringProperty()

class Campaign(ndb.Model):
    campaignId = ndb.StringProperty()
    accountId = ndb.StringProperty()
    identifier = ndb.StringProperty()
    status = ndb.StringProperty()
    requestLimit = ndb.StringProperty()
    tweetsPerRequest = ndb.StringProperty()
    name = ndb.StringProperty()
    createAt = ndb.StringProperty()
    updatedAt = ndb.StringProperty()
    hashTags = ndb.StringProperty()
    totalTweets = ndb.IntegerProperty()
    totalReplies = ndb.IntegerProperty()
