
module.exports = {

    'facebookAuth' : {
        'clientID'        : process.env.FACEBOOK_CLIENT_ID, // your App ID
        'clientSecret'    : process.env.FACEBOOK_SECRET, // your App Secret
        'callbackURL'     : 'http://quantifiedtrade.com/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'        : process.env.TWITTER_CONSUMER_KEY,
        'consumerSecret'     : process.env.TWITTER_CONSUMER_SECRET,
        'callbackURL'        : 'http://quantifiedtrade.com/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'         : process.env.GOOGLE_CLIENT_ID,
        'clientSecret'     : process.env.GOOGLE_SECRET,
        'callbackURL'      : 'http://quantifiedtrade.com/auth/google/callback'
    }

};
