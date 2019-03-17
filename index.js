const book = process.argv[2] || 'Genesis',
    fs = require('fs-extra'),
    onlineBible = 'https://www.bibliaon.com/',
    crawler = require("crawler"),
    pdf = require('html-pdf'),
    root = './root',
    basePath = `${root}/${book}`

fs.remove(root, () => {
    fs.mkdirSync(root)
    fs.mkdirSync(basePath)
});

const c = new crawler({
    maxConnections : 20,
    callback (error, res, done) {
        error && handleError(error)
        const $ = res.$,
            html = $('.versiculos').html(),
            currentPath = res.request.path.replace(/\//g,''),
            currentFolder = `${basePath}/${currentPath}`
        
        fs.mkdirSync(currentFolder)
        saveToFile(`${currentFolder}/livro${currentPath}`, html)
        done()
    }
})

c.direct({
    uri: `${onlineBible + book}`,
    callback (error, res) {
        error && handleError(error)
        res && getCapitulos(res).then((result => {
            c.queue(result)
        }))
    }
})


/**
 * Fn to get capitulos based on `res` (response) and return it on a promise
 * 
 * @param {*} res - mixed response data
 * @return {Promise} array of `capitulos`
 */
const getCapitulos = res => {
    const $ = res.$
    const capitulos = $('.menucapitulos li a')
    console.log(`O livro ${book} possui ${capitulos.length} capítulos`)
    return new Promise((resolve, reject) => {
        resolve(Array.from(capitulos).map(capitulo => `${onlineBible + capitulo.attribs.href}`))
    })
}


/**
 * Method to save `data` on `html` and then to `pdf`
 *
 * @param {string} [name='untitled']
 * @param {string} data - html data
 */
const saveToFile = (name = 'untitled', data) => {
    const htmlPath = `${name}.html`
    fs.writeFile(htmlPath, data, error => {
        error && handleError(error)
        
        pdf.create(data, { format: 'A4'}).toFile(`${name}.pdf`, function (error, res) {
            error && handleError(error)
        })
    })
}

/**
 * Throw up error to stop executions
 *
 * @param {*} err - mixed error data
 */
const handleError = err => { throw err }