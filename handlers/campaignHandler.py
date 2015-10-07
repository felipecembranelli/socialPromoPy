__author__ = 'feliperc'
# -*- coding: utf-8 -*-
# -*- coding: iso-8859-15 -*-


#******************************************************************************
# Imports
#******************************************************************************

import logging
import webapp2
import models
import json
import datetime
from google.appengine.ext import ndb

#******************************************************************************
# Campaign Handlers
#******************************************************************************
class campaignQueryHandler(webapp2.RequestHandler):
  def get(self):
    logging.getLogger().setLevel(logging.DEBUG)
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.headers['charset'] = 'utf-8'

    #try:

    logging.info('Get all campaigns')

    #self.SaveToDataStore("felipe","testando...")

    campaigns = self.getAllCampaigns()

    logging.info('Finished')

    result = [c.to_dict() for c in campaigns.fetch()]

    logging.info(result)

    self.SendJson(result)

  def getAllCampaigns(self):
    campaign_values = models.Campaign.query()

    return campaign_values

  def SendJson(self, r):
    self.response.headers['content-type'] = 'text/plain'
    self.response.write(json.dumps(r))

class campaignCreateHandler(webapp2.RequestHandler):
  def get(self):
    logging.getLogger().setLevel(logging.DEBUG)

    # sample url http://atlantean-force-90113.appspot.com/rest/campaignCreateHandler?campaignId=C9&name=trends&hashtag=%23NovinhosCheddar

    logging.info('Create campaign')

    campaignId = self.request.get('campaignId')
    name = self.request.get('name')
    hashtag = self.request.get('hashtag')

    logging.info(str(campaignId))
    logging.info(str(name))
    logging.info(str(hashtag))

    self.SaveToDataStore(campaignId,"1","1","Active","1","1",name,hashtag)

    logging.info('Finished')

  def SaveToDataStore(self, campaignId,accountId, identifier, status, requestLimit, tweetsPerRequest, name, hashTags):
    logging.info('Save to dataStore')

    c = models.Campaign()

    c.campaignId = campaignId
    c.accountId = accountId
    c.identifier = identifier
    c.status = status
    c.requestLimit = requestLimit
    c.tweetsPerRequest = tweetsPerRequest
    c.name = name
    c.createAt = str(datetime.datetime.now())
    c.updatedAt = str(datetime.datetime.now())
    c.hashTags = hashTags
    c.put()

class campaignDetailQueryHandler(webapp2.RequestHandler):
  def get(self):
    logging.getLogger().setLevel(logging.DEBUG)

    logging.info('Get campaign')

    campaignId = self.request.get('campaignId')

    logging.info("c=" + campaignId)

    campaign_values = models.Campaign.query()

    # Get by Key (internal)
    # for ca in campaign_values:
    #   logging.info(ca.key.id())
    #   id = ca.key.id()
    #   cid = ca.campaignId
    #   logging.info(cid)
    #
    # key = ndb.Key(models.Campaign, id)
    # campaign = key.get()
    #logging.info(campaign)

    camp = campaign_values.filter(models.Campaign.campaignId == str(campaignId))
    # for c in camp:
    #   logging.info('Encontrei=' + str(c.campaignId))

    logging.info('Finished')

    result = [c.to_dict() for c in camp.fetch()]

    self.SendJson(result[0])

  def SendJson(self, r):
    self.response.headers['content-type'] = 'text/plain'
    self.response.write(json.dumps(r))

class tweetsByCampaignIdHandler(webapp2.RequestHandler):
  def get(self):
    logging.getLogger().setLevel(logging.DEBUG)

    logging.info('Get tweets')

    campaignId = self.request.get('campaignId')

    logging.info("c=" + campaignId)

    tweets_values = models.Tweet.query()

    tweets = tweets_values.filter(models.Tweet.campaignId == str(campaignId))

    result = [c.to_dict() for c in tweets.fetch(100)]

    for o in result:
      logging.info(o)

    logging.info('Finished')

    self.SendJson(result)

  def SendJson(self, r):
    self.response.headers['content-type'] = 'text/plain'
    self.response.write(json.dumps(r))