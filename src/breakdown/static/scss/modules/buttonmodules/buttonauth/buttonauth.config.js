module.exports = {
  context: {
    text: 'Button Auth'
  },
  label: 'Button Auth',
  preview: '@preview--none',
  variants: [
    {
      context: {
        modifier: 'buttonauth-facebook',
        text: 'Facebook'
      },
      name: 'facebook',
      preview: '@preview'
    },
    {
      context: {
        modifier: 'buttonauth-google',
        text: 'Google'
      },
      name: 'google',
      preview: '@preview'
    },
    {
      context: {
        modifier: 'buttonauth-kony',
        text: 'Kony'
      },
      name: 'kony',
      preview: '@preview'
    },
    {
      context: {
        modifier: 'buttonauth-linkedin_oauth2',
        text: 'LinkedIn'
      },
      label: 'LinkedIn',
      name: 'linkedin',
      preview: '@preview'
    },
    {
      context: {
        modifier: 'buttonauth-twitter',
        text: 'Twitter'
      },
      name: 'twitter',
      preview: '@preview'
    },
    {
      context: {
        modifier: 'buttonauth-microsoft',
        text: 'Microsoft'
      },
      name: 'microsoft',
      preview: '@preview'
    }
  ]
};
