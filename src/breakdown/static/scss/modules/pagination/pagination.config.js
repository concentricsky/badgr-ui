module.exports = {
    preview: '@preview--none',
    status: 'wip',
    variants: [{
            label: 'Default',
            preview: '@preview--none',
        },
        {
            label: 'Default (Example)',
            preview: '@preview',
            view: 'pagination--example.hbs',
        },
        {
            label: 'Default (Example 2)',
            preview: '@preview',
            view: 'pagination--example2.hbs',
        },
    ].map(obj => {
        obj['name'] = obj.label.replace(/[\s+()]/g, '').toLowerCase();
        return obj;
    })
};