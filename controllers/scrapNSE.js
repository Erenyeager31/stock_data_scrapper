// import cheerio from 'cheerio'
import chalk from 'chalk'
import { load } from 'cheerio'; //! direct use of load is deprecated
// import axios from 'axios'
import pretty from 'pretty';
import fs, { read } from 'fs'
import puppeteer from 'puppeteer';
import reader from 'xlsx'

const url = 'https://www.nseindia.com/market-data/live-equity-market'
const path = 'ScrappedFiles'

function formatDateWithTime(date) {
    // Extract components of the date
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(2);
    
    // Get current time components
    let hours = String(date.getHours()).padStart(2, '0');
    if(hours > 12){
        hours = hours - 12
    }
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Construct the formatted date string
    const formattedDate = `${day}-${month}-${year}_T${hours}-${minutes}-${seconds}`;

    return formattedDate;
}

const scrapNSE = async (req, res) => {
    try {
        //* launch the browser
        const browser = await puppeteer.launch({ headless: false })

        //* open a new paget
        const page = await browser.newPage()
        await page.setViewport({ width: 1366, height: 768 });

        //* nwidle2 indicates wait till the networks requests have become less
        await page.goto(url, { waitUntil: 'networkidle2' })

        //! accessing dom for the data (NSE)
        await page.waitForSelector('#equityStockTable tbody', { visible: true })
        const stock_data = await page.evaluate(() => {
            const tbody = Array.from(document.querySelectorAll('#equityStockTable')).slice(0, 1)
            const value = tbody.map((item) => item.outerHTML).join(" ")
            return value;
        })

        //? using cheerio to load the data
        const $ = load(stock_data)

        //! dropping the last td for each of tr (it contains extra table, so dropping it)
        $('#equityStockTable > tbody > tr').each((index, element) => {
            //* console.log(chalk.white(index), chalk.red(pretty($(element).find('td:last-child').html())))
            $(element).find('td:last-child').remove()
        });
        const new_stock_data =$.html() //* saving the modified html into the variable
        fs.writeFileSync(`${path}/NSE_stock_data.html`,pretty(new_stock_data))  //* storing modified html into the .html file
        
        const col_name = {}
        //! Iterating through the 'thead' to extract column names
        $('#equityStockTable > thead > tr').each((index,element)=>{
            $(element).find('th').each((thIndex,thElement)=>{
                // console.log(chalk.white(thIndex),'->',chalk.red($(thElement).text().trim()))
                col_name[thIndex] = $(thElement).text().trim()
            })
            delete col_name['13']
        })

        let data = []
        data.push(col_name)
        //! iterating through the $ to store the values
        $('#equityStockTable > tbody > tr').each((index,element)=>{
            let json_data = {}
            $(element).find('td').each((tdIndex,tdElement)=>{
                json_data[col_name[tdIndex]] = $(tdElement).text().trim()
            })
            // console.log(json_data)
            data.push(json_data)
        })
        //! 2 in stringify is used to give indentation in the file
        fs.writeFileSync(`${path}/NSE_json_data.txt`,JSON.stringify(data,null,2))
        

        //? writing into excel file

        try {
            const file = reader.readFile('NSE.xlsx')
            const ws = reader.utils.json_to_sheet(data.slice(1))

            const currentDate = new Date();
            const formattedDate = formatDateWithTime(currentDate);

            reader.utils.book_append_sheet(file,ws,`NIFTY50_${formattedDate}`)
            reader.writeFile(file,'NSE.xlsx')
        } catch (error) {
            console.log(chalk.red("EXCEL Error"),chalk.blue("->"),chalk.white(error.message))
        }

        await browser.close()
        return res.status(200).json({
            message: "hi",
            data
        })
    } catch (error) {
        console.log(chalk.bgWhite("Error"),chalk.red(error.message))
    }
}

export default scrapNSE