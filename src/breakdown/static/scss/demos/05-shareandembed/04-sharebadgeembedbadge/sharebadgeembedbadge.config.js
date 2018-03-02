module.exports = {
  context: {
    buttonCopyContext: {
      text: 'Copy'
    },
    buttonValidateContext: {
      text: 'Validate'
    },
    checkbox: {
        moduleName: true
    },
    formFieldContext: {
      id: 'copy',
      inputText: false,
      inputTextarea: true,
      label: 'Embed Code',
      labelNote: false,
      readonly: true,
      value: '<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Read today&#39;s Calvin and Hobbes <a href="https://twitter.com/hashtag/comic?src=hash&amp;'
    },
    formRadioButtonCardContext: {
      id: 'card',
      name: 'type',
      text: 'Card'
    },
    formRadioButtonBadgeContext: {
      checked: true,
      id: 'badge',
      name: 'type',
      text: 'Badge'
    },
    lTabsContext: {
      tabs: [
        {
          context: {
            modifier: false,
            text: 'Link'
          }
        },
        {
          context: {
            text: 'Social'
          }
        },
        {
          context: {
            modifier: 'tab-is-active',
            text: 'Embed'
          }
        }
      ]
    },
    titleContext: {
      modifier: 'title-small title-uppercase',
      text: 'Preview'
    }
  },
  label: 'Share Badge - Embed (Badge)'
};
