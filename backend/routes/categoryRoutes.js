const express = require('express');
const router = express.Router();
const {
  create,
  getAll,
  getOne,
  update,
  delete: deleteItem
} = require('../controllers/categoryController');

router.post('/', create);
router.get('/', getAll);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', deleteItem);

module.exports = router; 