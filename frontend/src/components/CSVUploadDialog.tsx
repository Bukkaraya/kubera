import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { Account } from '../types/account';
import type { Category } from '../types/transaction';
import type {
  CSVUploadRequest,
  CSVUploadResponse,
  CSVPreviewResponse,
  CSVPreviewRow,
  CSVTransactionError,
} from '../types/transaction';
import { accountService } from '../services/accountService';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { CategorySelect } from './CategorySelect';

interface CSVUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type UploadStep = 'select-file' | 'preview' | 'upload' | 'complete';

export const CSVUploadDialog: React.FC<CSVUploadDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  console.log('CSVUploadDialog component rendered');
  // State management
  const [currentStep, setCurrentStep] = useState<UploadStep>('select-file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadConfig, setUploadConfig] = useState<CSVUploadRequest>({
    account_id: '',
    default_category_id: '',
    skip_header: true,
    date_format: '%Y-%m-%d',
  });
  const [previewData, setPreviewData] = useState<CSVPreviewResponse | null>(null);
  const [uploadResult, setUploadResult] = useState<CSVUploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionCategories, setTransactionCategories] = useState<Record<number, string>>({});

  // Data state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Category creation state for CSV preview
  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({ name: '', description: '' });
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryCreationError, setCategoryCreationError] = useState('');
  const [pendingRowNumber, setPendingRowNumber] = useState<number | null>(null);

  // Load accounts and categories when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
      resetState();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [accountsData, categoriesData] = await Promise.all([
        accountService.getAccounts(),
        categoryService.getCategories(),
      ]);
      setAccounts(accountsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const resetState = () => {
    setCurrentStep('select-file');
    setSelectedFile(null);
    setUploadConfig({
      account_id: '',
      default_category_id: '',
      skip_header: false, // Don't skip first row by default
      date_format: '%Y-%m-%d', // Always year-month-day format
    });
    setPreviewData(null);
    setUploadResult(null);
    setError('');
    setTransactionCategories({});
    // Reset category creation state
    setCreateCategoryDialogOpen(false);
    setNewCategoryData({ name: '', description: '' });
    setCategoryCreationError('');
    setPendingRowNumber(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv')) {
        setError('Please select a CSV or TSV file');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      // Stay on the same step - don't auto-advance
      setError('');
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError('');
             const preview = await transactionService.previewCSV(
         selectedFile,
         uploadConfig.skip_header,
         uploadConfig.date_format
       );
       console.log('Preview data received:', preview);
       console.log('First row amount type:', typeof preview.preview_rows?.[0]?.amount, 'value:', preview.preview_rows?.[0]?.amount);
       setPreviewData(preview);
       
       // Initialize transaction categories with default category
       const initialCategories: Record<number, string> = {};
       preview.preview_rows?.forEach((row) => {
         if (row.row_number && row.is_valid) {
           initialCategories[row.row_number] = uploadConfig.default_category_id;
         }
       });
       setTransactionCategories(initialCategories);
       
      setCurrentStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError('');
      setCurrentStep('upload');
      
      // Include transaction categories in the upload config
      const uploadConfigWithCategories = {
        ...uploadConfig,
        transaction_categories: transactionCategories
      };
      
      const result = await transactionService.uploadCSV(selectedFile, uploadConfigWithCategories);
      setUploadResult(result);
      setCurrentStep('complete');
      
      if (result.success) {
        // Call onSuccess after a short delay to show the success message
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV');
      setCurrentStep('preview'); // Go back to preview on error
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Category creation handlers for CSV preview
  const handleOpenCategoryCreation = (rowNumber: number) => {
    setPendingRowNumber(rowNumber);
    setCreateCategoryDialogOpen(true);
  };

  const handleCreateCategoryInPreview = async () => {
    if (!newCategoryData.name.trim()) {
      setCategoryCreationError('Category name is required');
      return;
    }

    try {
      setCreatingCategory(true);
      setCategoryCreationError('');
      
      const newCategory = await categoryService.createCategory({
        name: newCategoryData.name.trim(),
        description: newCategoryData.description.trim() || undefined,
      });
      
      // Add new category to the list
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      
      // Select the new category for the pending row
      if (pendingRowNumber !== null) {
        setTransactionCategories(prev => ({
          ...prev,
          [pendingRowNumber]: newCategory.id
        }));
      }
      
      // Close dialog and reset form
      handleCloseCategoryCreation();
    } catch (err) {
      setCategoryCreationError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCloseCategoryCreation = () => {
    setCreateCategoryDialogOpen(false);
    setNewCategoryData({ name: '', description: '' });
    setCategoryCreationError('');
    setPendingRowNumber(null);
    setCreatingCategory(false);
  };

  const renderFileSelection = () => (
    <Box sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CloudUploadIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Upload CSV File
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select a CSV or TSV file containing your transactions
        </Typography>
        
        <input
          accept=".csv,.tsv"
          style={{ display: 'none' }}
          id="csv-upload-input"
          type="file"
          onChange={handleFileSelect}
        />
        <label htmlFor="csv-upload-input">
          <Button
            variant="contained"
            component="span"
            startIcon={<CloudUploadIcon />}
            size="large"
          >
            Choose File
          </Button>
        </label>

        {selectedFile && (
          <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
            <strong>File selected:</strong> {selectedFile.name}
          </Alert>
        )}
      </Box>

      {selectedFile && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth required>
            <InputLabel>Account</InputLabel>
            <Select
              value={uploadConfig.account_id}
              onChange={(e) => setUploadConfig(prev => ({ ...prev, account_id: e.target.value }))}
              label="Account"
              disabled={loadingData}
            >
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name} ({account.account_type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <CategorySelect
            value={uploadConfig.default_category_id}
            onChange={(value) => setUploadConfig(prev => ({ ...prev, default_category_id: value }))}
            categories={categories}
            onCategoriesChange={setCategories}
            required
            label="Default Category"
            disabled={loadingData}
          />
        </Box>
      )}
    </Box>
  );



  const renderPreview = () => {
    if (!previewData) return null;

    try {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={<InfoIcon />}
              label={`${previewData.total_rows || 0} rows detected`}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<CheckCircleIcon />}
              label={`${previewData.estimated_valid_rows || 0} valid`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={previewData.detected_format || 'unknown'}
              variant="outlined"
            />
          </Box>

          {previewData.validation_errors && previewData.validation_errors.length > 0 && (
            <Alert severity="warning">
              <Typography variant="subtitle2" gutterBottom>
                Validation Issues:
              </Typography>
              {previewData.validation_errors.map((error, index) => (
                <Typography key={index} variant="body2">
                  • {error}
                </Typography>
              ))}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">
              Preview (first {previewData.preview_rows?.length || 0} rows):
            </Typography>
            {(() => {
              const validRows = previewData.preview_rows?.filter(row => row.is_valid && row.row_number) || [];
              const categorizedRows = validRows.filter(row => 
                row.row_number && transactionCategories[row.row_number]
              );
              const remaining = validRows.length - categorizedRows.length;
              
              if (remaining > 0) {
                return (
                  <Alert severity="info" sx={{ py: 0 }}>
                    {remaining} transaction{remaining !== 1 ? 's' : ''} need{remaining === 1 ? 's' : ''} categories
                  </Alert>
                );
              }
              return null;
            })()}
          </Box>

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Payee</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(previewData.preview_rows || []).map((row) => (
                  <TableRow key={row.row_number || Math.random()}>
                    <TableCell>{row.row_number || 'N/A'}</TableCell>
                    <TableCell>{row.transaction_date || 'N/A'}</TableCell>
                    <TableCell>{row.payee || 'N/A'}</TableCell>
                    <TableCell align="right">
                      ${row.amount || '0'}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {row.is_valid && row.row_number ? (
                        <FormControl size="small" fullWidth>
                          <Select
                            value={transactionCategories[row.row_number] || ''}
                            onChange={(e) => {
                              const selectedValue = e.target.value;
                              if (selectedValue === '__add_new__') {
                                handleOpenCategoryCreation(row.row_number!);
                              } else {
                                setTransactionCategories(prev => ({
                                  ...prev,
                                  [row.row_number!]: selectedValue
                                }));
                              }
                            }}
                            displayEmpty
                          >
                            {categories.map((category) => (
                              <MenuItem key={category.id} value={category.id}>
                                {category.name}
                              </MenuItem>
                            ))}
                            <Divider />
                            <MenuItem value="__add_new__">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AddIcon fontSize="small" />
                                Add New Category
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.is_valid ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Valid"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<ErrorIcon />}
                          label="Error"
                          color="error"
                          size="small"
                        />
                      )}
                      {!row.is_valid && row.errors && row.errors.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {row.errors.map((error, index) => (
                            <Typography key={index} variant="caption" color="error" display="block">
                              {error}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    } catch (error) {
      console.error('Error rendering preview:', error);
      return (
        <Alert severity="error">
          Error rendering preview. Please check the console for details.
        </Alert>
      );
    }
  };

  const renderUploadProgress = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h6" gutterBottom>
        Uploading Transactions...
      </Typography>
      <LinearProgress sx={{ mt: 2, mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Please wait while we process your CSV file
      </Typography>
    </Box>
  );

  const renderUploadComplete = () => {
    if (!uploadResult) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Alert severity={uploadResult.success ? 'success' : 'error'}>
          {uploadResult.message}
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Chip
            icon={<CheckCircleIcon />}
            label={`${uploadResult.successful_imports} imported`}
            color="success"
            variant="outlined"
          />
          {uploadResult.failed_imports > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={`${uploadResult.failed_imports} failed`}
              color="error"
              variant="outlined"
            />
          )}
        </Box>

        {uploadResult.errors.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                View Errors ({uploadResult.errors.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {uploadResult.errors.map((error, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Row ${error.row_number}: ${error.error_message}`}
                      secondary={error.raw_data}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    );
  };

  const getDialogTitle = () => {
    switch (currentStep) {
      case 'select-file':
        return 'Upload CSV Transactions';
      case 'preview':
        return 'Preview Transactions';
      case 'upload':
        return 'Uploading...';
      case 'complete':
        return 'Upload Complete';
      default:
        return 'Upload CSV';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'preview':
        if (!previewData || previewData.estimated_valid_rows === 0) {
          return false;
        }
        
        // Check that all valid transactions have categories selected
        const validRows = previewData.preview_rows?.filter(row => row.is_valid && row.row_number) || [];
        const allCategoriesSelected = validRows.every(row => 
          row.row_number && transactionCategories[row.row_number]
        );
        
        return allCategoriesSelected;
      default:
        return false;
    }
  };

  try {
    return (
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown={loading}
      >
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        
        <DialogContent sx={{ minHeight: 400 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loadingData && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Loading accounts and categories...
            </Alert>
          )}

          {currentStep === 'select-file' && renderFileSelection()}
          {currentStep === 'preview' && renderPreview()}
          {currentStep === 'upload' && renderUploadProgress()}
          {currentStep === 'complete' && renderUploadComplete()}
        </DialogContent>
      
      <DialogActions>
        {currentStep === 'select-file' && (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            {selectedFile && uploadConfig.account_id && uploadConfig.default_category_id && (
              <Button
                onClick={handlePreview}
                variant="contained"
                disabled={loading}
              >
                Preview
              </Button>
            )}
          </>
        )}
        
        {currentStep === 'preview' && (
          <>
            <Button onClick={() => setCurrentStep('select-file')} disabled={loading}>
              Back
            </Button>
            <Button
              onClick={handleUpload}
              variant="contained"
              disabled={!canProceed() || loading}
              color="primary"
            >
              Upload Transactions
            </Button>
          </>
        )}
        
        {currentStep === 'complete' && (
          <Button onClick={handleClose} disabled={loading}>
            Done
          </Button>
        )}
      </DialogActions>
    
      {/* Category Creation Dialog */}
      <Dialog 
        open={createCategoryDialogOpen} 
        onClose={handleCloseCategoryCreation}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Category</DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {categoryCreationError && (
              <Alert severity="error">
                {categoryCreationError}
              </Alert>
            )}

            <TextField
              label="Category Name"
              value={newCategoryData.name}
              onChange={(e) => setNewCategoryData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              disabled={creatingCategory}
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
              disabled={creatingCategory}
              placeholder="Optional description for this category"
              inputProps={{ maxLength: 255 }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleCloseCategoryCreation} 
            disabled={creatingCategory}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCategoryInPreview}
            variant="contained"
            disabled={creatingCategory || !newCategoryData.name.trim()}
          >
            {creatingCategory ? 'Creating...' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
  } catch (error) {
    console.error('Error rendering CSVUploadDialog:', error);
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm">
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            An error occurred while loading the CSV upload dialog. Please check the console for details.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
}; 