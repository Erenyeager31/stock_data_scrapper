// import cheerio from 'cheerio'
import chalk from 'chalk'
import { load } from 'cheerio'; //! direct use of load is deprecated
import axios from 'axios'
import pretty from 'pretty';
import fs from 'fs'
import puppeteer from 'puppeteer';
import { table } from 'console';

// const url = 'https://www.bseindia.com/eqstreamer/'
const url = 'https://www.nseindia.com/market-data/live-equity-market'
// const url = "https://www.amazon.com/"

const scrapTest = async (req, res) => {
    try {
        //* launch the browser
        const browser = await puppeteer.launch({ headless: false })

        //* open a new paget
        const page = await browser.newPage()
        await page.setViewport({ width: 1366, height: 768 });

        //* open the url
        // await page.goto(url, { waitUntil: 'domcontentloaded' })

        //! accessing all the categories from the data
        // await page.waitForSelector('#dllFilter2', { visible: true })
        // const options_data = await page.evaluate(()=>{
        //     const options = Array.from(document.querySelectorAll('#dllFilter2'))
        //     return options
        // })
        // console.log(options_data)

        // //! accessing dom for the data (BSE)
        // // page.on('console', (log) => console[log.type](log.text));
        // await page.waitForSelector('tbody', { visible: true })
        // // await page.screenshot({path:'example.png'})
        // const stock_data = await page.evaluate(() => {
        //     const tbody = Array.from(document.querySelectorAll('.mktwatchtable'))
        //     const value = tbody.map((item)=>item.outerHTML).join(" ")
        //     return value;
        // })

        // //* using cheerio to load the data
        // // fs.writeFileSync('stock_data.txt', pretty(stock_data));
        // // console.log(stock_data.length)
        // const $ = load(stock_data)

        // // console.log(pretty($('table tbody tr').text()))
        // // fs.writeFileSync('stock_data_table.txt', pretty($('table tbody tr').text()));
        // let data = []
        // let json_data = {}

        // //* access all the tr's and then traverse through the same
        // $('table tbody tr').each((index,element)=>{

        //     //* inside each tr find td and traverse them
        //     $(element).find('td').each((tdIndex,tdElement)=>{
        //         //* extract text and insert into json_data
        //         const tdText = $(tdElement).text().trim()
        //         json_data['td'+tdIndex] = tdText
        //     })
        //     data.push(json_data)
        // })
        // fs.writeFileSync('json_data.txt',data.toString())
        // console.log(data)

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

        //! dropping the last td for each of tr
        $('#equityStockTable > tbody > tr').each((index, element) => {
            //* console.log(chalk.white(index), chalk.red(pretty($(element).find('td:last-child').html())))
            $(element).find('td:last-child').remove()
        });
        const new_stock_data =$.html() //* saving the modified html into the variable
        fs.writeFileSync('nse_stock_data.html',pretty(new_stock_data))  //* storing modified html into the .html file
        
        const col_name = {}
        //! Iterating through the 'thead' to extract column names
        $('#equityStockTable > thead > tr').each((index,element)=>{
            $(element).find('th').each((thIndex,thElement)=>{
                // console.log(chalk.white(thIndex),'->',chalk.red($(thElement).text().trim()))
            console.log(index)

                col_name[thIndex] = $(thElement).text().trim()
            })
            delete col_name['13']
        })

        let data = []
        data.push(col_name)
        let json_data = {}
        //! iterating through the $ to store the values
        $('#equityStockTable > tbody > tr').each((index,element)=>{
            $(element).find('td').each((tdIndex,tdElement)=>{
                json_data[tdIndex] = $(tdElement).text().trim()
            })
            // console.log(json_data)
            data.push(json_data)
        })
        //! 2 in stringify is used to give indentation in the file
        fs.writeFileSync('nse_data.txt',JSON.stringify(data,null,2))
        
        await browser.close()
        return res.status(200).json({
            message: "hi",
            data:data[0]
        })
    } catch (error) {
        console.log(chalk.bgWhite("Error"),chalk.red(error.message))
    }
}

export default scrapTest
