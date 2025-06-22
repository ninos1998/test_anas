const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole
} = require('../controllers/userController');

// router.use(protect);
// router.use(authorize('admin'));

router.get('/', protect,authorize('admin'),  getUsers);
// router.get('/', getUsers);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

  router.route('/:id/role')
  .put(protect, authorize('admin'), updateUserRole);
  
// router.put('/:id/role', protect, authorize('admin'), async (req, res) => {
//   try {
//     const { role } = req.body;
//     const { id } = req.params;

//     const validRoles = ['user', 'admin', 'editor', 'writer'];
//     if (!validRoles.includes(role)) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Rôle invalide. Les rôles valides sont: user, admin, editor, writer' 
//       });
//     }

//     const user = await User.findByIdAndUpdate(
//       id,
//       { role },
//       { new: true, runValidators: true }
//     );

//     if (!user) {
//       return res.status(404).json({ 
//         success: false,
//         error: `Aucun utilisateur trouvé avec l'id ${id}` 
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: user
//     });

//   } catch (error) {
//     console.error('Erreur lors de la mise à jour du rôle:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Erreur serveur lors de la mise à jour du rôle' 
//     });
//   }
// });  

module.exports = router;