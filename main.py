# -*- coding: utf-8 -*-
# -*- coding: iso-8859-15 -*-

#******************************************************************************
# Imports
#******************************************************************************

import webapp2
from handlers.socialPromoHandler import *
from handlers.campaignHandler import *

#******************************************************************************
# Entry point
#******************************************************************************

app = webapp2.WSGIApplication([
    ('/rest/SocialPromoQueue', SocialPromoQueue),
    ('/rest/SocialPromoWorker', SocialPromoWorker),
    ('/rest/campaignQueryHandler', campaignQueryHandler),
    ('/rest/campaignCreateHandler', campaignCreateHandler),
    ('/rest/campaignDetailQueryHandler', campaignDetailQueryHandler),
    ('/rest/tweetsByCampaignIdHandler', tweetsByCampaignIdHandler)
    ],debug=True)
