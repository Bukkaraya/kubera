import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { Category } from '../types/transaction';
import { categoryService } from '../services/categoryService';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  fullWidth?: boolean;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  categories,
  onCategoriesChange,
  disabled = false,
  required = false,
  label = "Category",
  fullWidth = true,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSelectChange = (event: any) => {
    const selectedValue = event.target.value;
    
    if (selectedValue === '__add_new__') {
      setCreateDialogOpen(true);
    } else {
      onChange(selectedValue);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setCreating(true);
      setError('');
      
      const newCategory = await categoryService.createCategory({
        name: newCategoryData.name.trim(),
        description: newCategoryData.description.trim() || undefined,
      });
      
      // Add new category to the list
      const updatedCategories = [...categories, newCategory];
      onCategoriesChange(updatedCategories);
      
      // Select the new category
      onChange(newCategory.id);
      
      // Close dialog and reset form
      handleCloseCreateDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewCategoryData({ name: '', description: '' });
    setError('');
    setCreating(false);
  };

  return (
    <>
      <FormControl fullWidth={fullWidth} required={required} disabled={disabled}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          label={label}
          onChange={handleSelectChange}
        >
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
          
          <Divider />
          
          <MenuItem value="__add_new__">
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Add New Category" />
          </MenuItem>
        </Select>
      </FormControl>

      {/* Create Category Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Category</DialogTitle>
        
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            <TextField
              label="Category Name"
              value={newCategoryData.name}
              onChange={(e) => setNewCategoryData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              disabled={creating}
              placeholder="e.g., Groceries, Entertainment"
              inputProps={{ maxLength: 100 }}
              autoFocus
            />

            <TextField
              label="Description (Optional)"
              value={newCategoryData.description}
              onChange={(e) => setNewCategoryData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
              disabled={creating}
              placeholder="Optional description for this category"
              inputProps={{ maxLength: 255 }}
            />
          </div>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleCloseCreateDialog} 
            disabled={creating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCategory}
            variant="contained"
            disabled={creating || !newCategoryData.name.trim()}
          >
            {creating ? 'Creating...' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};