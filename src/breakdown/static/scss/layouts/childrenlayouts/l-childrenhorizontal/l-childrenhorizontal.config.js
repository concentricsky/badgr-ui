module.exports = {
	label:'Children Horizontal',
    preview: '@preview--none',
	variants: [
		{
            context: {
                modifier: 'l-childrenhorizontal-right'
            },
            name:'right'
		},
		{
            context: {
                modifier: 'l-childrenhorizontal-small'
            },
            name:'small'
		},
		{
            context: {
                modifier: 'l-childrenhorizontal-spacebetween'
            },
            name:'spacebetween'
		},
		{
            context: {
                modifier: 'l-childrenhorizontal-stackmobile'
            },
            name:'stackmobile'
		},
        {
            context: {
                modifier: 'l-childrenhorizontal-stackmobile-achieve'
            },
            name:'stackmobileachieve'
        }
	]
}