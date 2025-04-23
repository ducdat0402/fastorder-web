import React, { useState, useEffect } from 'react';
   import { getFoods, getCategories, createFood, updateFood, deleteFood } from '../services/api';

   const Admin = () => {
     const [foods, setFoods] = useState([]);
     const [categories, setCategories] = useState([]);
     const [formData, setFormData] = useState({
       id: '',
       name: '',
       description: '',
       price: '',
       img_url: '',
       is_available: true,
       category_id: '',
     });
     const [isEditing, setIsEditing] = useState(false);

     useEffect(() => {
       const fetchData = async () => {
         try {
           const [foodData, categoryData] = await Promise.all([
             getFoods(),
             getCategories(),
           ]);
           setFoods(foodData);
           setCategories(categoryData);
         } catch (err) {
           console.error('Failed to fetch data:', err);
           alert('Failed to fetch data: ' + (err.response?.data?.error || 'Unknown error'));
         }
       };
       fetchData();
     }, []);

     const handleInputChange = (e) => {
       const { name, value, type, checked } = e.target;
       setFormData({
         ...formData,
         [name]: type === 'checkbox' ? checked : value,
       });
     };

     const handleSubmit = async (e) => {
       e.preventDefault();
       try {
         const foodData = {
           name: formData.name,
           description: formData.description,
           price: parseInt(formData.price),
           img_url: formData.img_url || 'https://via.placeholder.com/150',
           is_available: formData.is_available,
           category_id: parseInt(formData.category_id),
         };

         if (isEditing) {
           await updateFood(formData.id, foodData);
           setFoods(foods.map((food) =>
             food.id === formData.id ? { ...food, ...foodData } : food
           ));
           alert('Food updated successfully!');
         } else {
           const newFood = await createFood(foodData);
           setFoods([...foods, newFood]);
           alert('Food added successfully!');
         }
         resetForm();
       } catch (err) {
         console.error('Failed to save food:', err);
         alert('Failed to save food: ' + (err.response?.data?.error || 'Unknown error'));
       }
     };

     const handleEdit = (food) => {
       setFormData({
         id: food.id,
         name: food.name,
         description: food.description,
         price: food.price,
         img_url: food.img_url,
         is_available: food.is_available,
         category_id: food.category_id,
       });
       setIsEditing(true);
     };

     const handleDelete = async (id) => {
       if (!window.confirm('Are you sure you want to delete this food?')) return;
       try {
         await deleteFood(id);
         setFoods(foods.filter((food) => food.id !== id));
         alert('Food deleted successfully!');
       } catch (err) {
         console.error('Failed to delete food:', err);
         alert('Failed to delete food: ' + (err.response?.data?.error || 'Unknown error'));
       }
     };

     const resetForm = () => {
       setFormData({
         id: '',
         name: '',
         description: '',
         price: '',
         img_url: '',
         is_available: true,
         category_id: '',
       });
       setIsEditing(false);
     };

     return (
       <div className="p-4">
         <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

         {/* Form thêm/sửa món ăn */}
         <div className="mb-8 p-4 bg-white rounded shadow">
           <h2 className="text-xl font-semibold mb-4">
             {isEditing ? 'Edit Food' : 'Add New Food'}
           </h2>
           <form onSubmit={handleSubmit}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block mb-1">Name</label>
                 <input
                   type="text"
                   name="name"
                   value={formData.name}
                   onChange={handleInputChange}
                   className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                   required
                 />
               </div>
               <div>
                 <label className="block mb-1">Description</label>
                 <input
                   type="text"
                   name="description"
                   value={formData.description}
                   onChange={handleInputChange}
                   className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               <div>
                 <label className="block mb-1">Price (VND)</label>
                 <input
                   type="number"
                   name="price"
                   value={formData.price}
                   onChange={handleInputChange}
                   className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                   required
                 />
               </div>
               <div>
                 <label className="block mb-1">Image URL</label>
                 <input
                   type="text"
                   name="img_url"
                   value={formData.img_url}
                   onChange={handleInputChange}
                   className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               <div>
                 <label className="block mb-1">Category</label>
                 <select
                   name="category_id"
                   value={formData.category_id}
                   onChange={handleInputChange}
                   className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                   required
                 >
                   <option value="">Select Category</option>
                   {categories.map((cat) => (
                     <option key={cat.id} value={cat.id}>
                       {cat.name}
                     </option>
                   ))}
                 </select>
               </div>
               <div className="flex items-center">
                 <label className="mr-2">Available</label>
                 <input
                   type="checkbox"
                   name="is_available"
                   checked={formData.is_available}
                   onChange={handleInputChange}
                   className="h-5 w-5"
                 />
               </div>
             </div>
             <div className="mt-4 flex space-x-2">
               <button
                 type="submit"
                 className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
               >
                 {isEditing ? 'Update' : 'Add'} Food
               </button>
               {isEditing && (
                 <button
                   type="button"
                   onClick={resetForm}
                   className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                 >
                   Cancel
                 </button>
               )}
             </div>
           </form>
         </div>

         {/* Danh sách món ăn */}
         <div>
           <h2 className="text-xl font-semibold mb-4">Food List</h2>
           {foods.length === 0 ? (
             <p className="text-gray-500">No foods available.</p>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                 <thead>
                   <tr className="bg-gray-200">
                     <th className="p-2 text-left">Name</th>
                     <th className="p-2 text-left">Description</th>
                     <th className="p-2 text-left">Price</th>
                     <th className="p-2 text-left">Category</th>
                     <th className="p-2 text-left">Available</th>
                     <th className="p-2 text-left">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {foods.map((food) => (
                     <tr key={food.id} className="border-b">
                       <td className="p-2">{food.name}</td>
                       <td className="p-2">{food.description}</td>
                       <td className="p-2">{food.price} VND</td>
                       <td className="p-2">{food.category_name}</td>
                       <td className="p-2">{food.is_available ? 'Yes' : 'No'}</td>
                       <td className="p-2 space-x-2">
                         <button
                           onClick={() => handleEdit(food)}
                           className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                         >
                           Edit
                         </button>
                         <button
                           onClick={() => handleDelete(food.id)}
                           className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                         >
                           Delete
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </div>
       </div>
     );
   };

   export default Admin;