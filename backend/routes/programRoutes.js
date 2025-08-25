const express = require('express');
const router = express.Router();
const {
  create,
  getAll,
  getOne,
  update,
  delete: deleteItem,
  copy,
  view,
  share,
  acceptProgram,
  rejectProgram,
  fetchStatus,
  togglePinnedProgram,
  aproveProgram
} = require('../controllers/programController');

router.post('/', create);

router.get('/', getAll);
// router.get('/:id', getOne);

router.put('/:id', update);
router.put('/:id/copy', copy);
router.put('/:id/view', view);
router.put('/:id/share', share);


router.delete('/:id', deleteItem);

router.post('/accept', acceptProgram);
router.post('/reject', rejectProgram);
router.post('/status', fetchStatus);
router.get('/:id/pinned', togglePinnedProgram);
router.get('/aprrove', aproveProgram);
module.exports = router; 