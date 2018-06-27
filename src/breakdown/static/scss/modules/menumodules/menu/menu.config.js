module.exports = {
  context: {
    menuItems: [
      {
        context: {
          modifier: 'menuitem-is-active'
        },
        text: 'Backpack'
      },
      {
        text: 'Collections'
      },
      {
        text: 'Issuers'
      }
    ],
    menuItemsDropdown: [
      {
        context: {
          modifier: 'menuitem-secondary'
        },
        text: 'Profile'
      },
      {
        context: {
          modifier: 'menuitem-secondary'
        },
        text: 'App Integrations'
      },
      {
        context: {
          modifier: 'menuitem-secondary'
        },
        text: 'Sign Out'
      }
    ]
  }
};
