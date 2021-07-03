/* -------------------------------------------------------------------------- */
// To start this project type : npm start
/* -------------------------------------------------------------------------- */

// Test API URL = https://jsonplaceholder.typicode.com/todos/1

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import axios from 'axios'
import prettyBytes from 'pretty-bytes'
import setupEditors from './setupEditor'

/* ---------------------------- Document elements --------------------------- */
const form = document.querySelector('[data-form]')
const queryParamsContainer = document.querySelector('[data-query-params]')
const requestHeadersContainer = document.querySelector('[data-request-headers]')
const keyValueTemplate = document.querySelector('[data-key-value-template]')
const responseHeadersContainer = document.querySelector(
    '[data-response-headers]'
)

// Add key-value slots when clicked on "Add" button in QueryParams
document
    .querySelector('[data-add-query-params-btn]')
    .addEventListener('click', (e) => {
        queryParamsContainer.append(createKeyValuePair())
    })

// Add key-value slots when clicked on "Add" button in RequestHeaders
document
    .querySelector('[data-add-request-header-btn]')
    .addEventListener('click', (e) => {
        requestHeadersContainer.append(createKeyValuePair())
    })

// Add one key-value pair to RequestHeaders and QueryParams at the start
queryParamsContainer.append(createKeyValuePair())
requestHeadersContainer.append(createKeyValuePair())

// Intercept request
axios.interceptors.request.use((request) => {
    request.customData = request.customData || {}
    request.customData.startTime = new Date().getTime()
    return request
})

// Take account of end-time after receiving response
function updateEndTime(response) {
    response.customData = response.customData || {}
    response.customData.time =
        new Date().getTime() - response.config.customData.startTime // "config" means request for the current response
    return response
}

// Intercept response
axios.interceptors.response.use(updateEndTime, (e) => {
    return Promise.reject(updateEndTime(e.response))
})

// Request and Response JSON
const { requestEditor, updateResponseEditor } = setupEditors()

// After clicked on SEND button
form.addEventListener('submit', (e) => {
    e.preventDefault()

    // Take JSON as request data
    let data
    try {
        data = JSON.parse(requestEditor.state.doc.toString() || null)
    } catch (e) {
        alert('JSON data is malformed!')
        return
    }

    // Deal with the request
    axios({
        url: document.querySelector('[data-url]').value,
        method: document.querySelector('[data-method]').value,
        params: keyValuePairsToObjects(queryParamsContainer),
        headers: keyValuePairsToObjects(requestHeadersContainer),
        data,
    })
        .catch((e) => e)
        .then((response) => {
            document
                .querySelector('[data-response-section]')
                .classList.remove('d-none')

            updateResponseDetails(response)
            updateResponseEditor(response.data)
            updateResponseHeaders(response.headers)
            // console.log(response)
        })
})

/* -------------------------------- Functions ------------------------------- */

// Add key Value fields
function createKeyValuePair() {
    const element = keyValueTemplate.content.cloneNode(true)
    element
        .querySelector('[data-remove-button]')
        .addEventListener('click', (e) => {
            e.target.closest('[data-key-value-pair]').remove()
        })

    return element
}

// Convert key-value pairs to objects
function keyValuePairsToObjects(container) {
    const pairs = container.querySelectorAll('[data-key-value-pair]')
    return [...pairs].reduce((data, pair) => {
        const key = pair.querySelector('[data-key]').value
        const value = pair.querySelector('[data-value]').value

        if (key === '') return data
        return { ...data, [key]: value }
    }, {})
}

// Update status code, time and size in response section
function updateResponseDetails(response) {
    document.querySelector('[data-status]').textContent = response.status
    document.querySelector('[data-time]').textContent = response.customData.time
    document.querySelector('[data-size]').textContent = prettyBytes(
        JSON.stringify(response.data).length +
            JSON.stringify(response.headers).length
    )
}

// Update response headers
function updateResponseHeaders(headers) {
    responseHeadersContainer.innerHTML = ''

    Object.entries(headers).forEach(([key, value]) => {
        const keyElement = document.createElement('div')
        keyElement.textContent = key
        responseHeadersContainer.append(keyElement)

        const valueElement = document.createElement('div')
        valueElement.textContent = value
        responseHeadersContainer.append(valueElement)
    })
}
