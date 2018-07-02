module.exports = {
  context: {
    authButtons: [
      {
        context: {
          modifier: 'buttonauth-facebook',
          text: 'Facebook'
        }
      },
      {
        context: {
          modifier: 'buttonauth-kony',
          text: 'Kony'
        }
      },
      {
        context: {
          modifier: 'buttonauth-linkedin_oauth2',
          text: 'LinkedIn'
        }
      },
      {
        context: {
          modifier: 'buttonauth-google',
          text: 'Google'
        }
      },
      {
        context: {
          modifier: 'buttonauth-microsoft',
          text: 'Microsoft'
        }
      }
    ]
  },
  label: 'Auth Buttons'
};
