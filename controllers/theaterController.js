const theaterService = require('../services/theaterService')

const apply = async (req, res, next) => {
    try {
        const result = await theaterService.applyForTheater(req.body)
        res.status(result.statusCode).json({ message: result.message })
    } catch (err) {
        next(err)
    }
}

const approve = async (req, res, next) => {
    try {
        const result = await theaterService.approveTheater(req.params.id)
        res.status(result.statusCode).json({ message: result.message })
    } catch (err) {
        next(err)
    }
}
const createScreen = async (req, res, next) => {
    try {
        const screen = await theaterService.createScreen(req.body)
        res.status(201).json({ message: "Screen created", screen })
    } catch (err) {
        next(err)
    }
}
const updateScreen = async (req, res, next) => {
    try {
        const screen = await theaterService.updateScreen(req.params.id, req.body)
        res.status(200).json({ message: 'Screen updated', screen })
    } catch (err) {
        next(err)
    }
}

const deleteScreen = async (req, res, next) => {
    try {
        await theaterService.deleteScreen(req.params.id)
        res.status(200).json({ message: 'Screen deleted' })
    } catch (err) {
        next(err)
    }
}


module.exports = {
    apply,
    approve
}
