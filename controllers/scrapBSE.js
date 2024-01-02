// import cheerio from 'cheerio'
import chalk from 'chalk'
import { load } from 'cheerio'; //! direct use of load is deprecated
// import axios from 'axios'
import pretty from 'pretty';
import fs from 'fs'
import puppeteer from 'puppeteer';
import reader from 'xlsx'

const url = 'https://www.bseindia.com/eqstreamer/'
const path = 'ScrappedFiles'

function formatDateWithTime(date) {
    // Extract components of the date
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(2);

    // Get current time components
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Construct the formatted date string
    const formattedDate = `${day}-${month}-${year}_T${hours}-${minutes}-${seconds}`;

    return formattedDate;
}

const scrapBSE = async (req, res) => {
    try {
        //* launch the browser
        const browser = await puppeteer.launch({ headless: false })

        //* open a new paget
        const page = await browser.newPage()
        await page.setViewport({ width: 1366, height: 768 });

        //* open the url
        await page.goto(url, { waitUntil: 'networkidle2' })

        //! accessing all the categories from the data
        // await page.waitForSelector('#dllFilter2', { visible: true })
        // const options_data = await page.evaluate(()=>{
        //     const options = Array.from(document.querySelectorAll('#dllFilter2'))
        //     return options
        // })
        // console.log(options_data)

        // //! accessing dom for the data (BSE)
        // page.on('console', (log) => console[log.type](log.text));
        await page.waitForSelector('tbody', { visible: true })
        // await page.screenshot({path:'example.png'})
        const stock_data = await page.evaluate(() => {
            const tbody = Array.from(document.querySelectorAll('.mktwatchtable'))
            const value = tbody.map((item) => item.outerHTML).join(" ")
            return value;
        })

        //? using cheerio to load the data
        const $ = load(stock_data)

        // fs.writeFileSync(`${path}/BSE_stock_data.html`, pretty($.html()))  //* storing modified html into the .html file

        // console.log(pretty($('table tbody tr').text()))
        // fs.writeFileSync('stock_data_table.txt', pretty($('table tbody tr').text()));
        const col_name = {}
        //! Iterating through the 'thead' to extract column names
        $('table > thead > tr').each((index, element) => {
            $(element).find('th').each((thIndex, thElement) => {
                // console.log(chalk.white(thIndex),'->',chalk.red($(thElement).text().trim()))
                col_name[thIndex - 1] = $(thElement).text().trim()
            })
            delete col_name['-1']
            // delete col_name['15']
        })

        let data = []
        data.push(col_name)

        //* access all the tr's and then traverse through the same
        $('table tbody tr').each((index, element) => {
            //* inside each tr find td and traverse them
            let json_data = {}
            $(element).find('td').each((tdIndex, tdElement) => {
                //* extract text and insert into json_data
                // console.log(chalk.white(tdIndex),'->',chalk.red($(tdElement).text().trim()))
                const tdText = $(tdElement).text().trim()
                json_data[col_name[tdIndex]] = tdText
            })
            delete json_data[col_name[15]]
            // console.log(json_data[0])
            data.push(json_data)
        })
        delete col_name['15']
        fs.writeFileSync(`${path}/BSE_json_data.txt`, JSON.stringify(data, null, 2))
        // console.log(data)

        //? writing into excel file
        try {
            const file = reader.readFile('BSE.xlsx')
            const ws = reader.utils.json_to_sheet(data.slice(1))

            const currentDate = new Date();
            const formattedDate = formatDateWithTime(currentDate);

            reader.utils.book_append_sheet(file, ws, `SENSEX_${formattedDate}`)
            reader.writeFile(file, 'BSE.xlsx')
        } catch (error) {
            console.log(chalk.red("EXCEL Error"), chalk.blue("->"), chalk.white(error.message))
        }

        await browser.close()
        return res.status(200).json({
            message: "hi",
            data
        })
    } catch (error) {
        console.log(chalk.bgWhite("Error"), chalk.red(error.message))
    }
}

export default scrapBSE