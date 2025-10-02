'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Recipe } from '@/types/recipe'
import {
  Box,
  CircularProgress,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Button,
  Snackbar,
  Alert,
} from '@mui/material'
import FlagIcon from '@mui/icons-material/Flag'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

export function RecommendedRecipes() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const router = useRouter()
  const { translations } = useLanguage()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalRecipes, setTotalRecipes] = useState(0)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'info',
  })

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return
    }

    const abortController = new AbortController()

    async function fetchRecommendedRecipes() {
      setLoading(true)

      try {
        const token = await getToken()
        const response = await fetch(
          `/api/recipes/recommended?page=${page}&limit=20`,
          {
            signal: abortController.signal,
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        // Handle 503 Service Unavailable (external API down) gracefully
        if (response.status === 503) {
          if (!abortController.signal.aborted) {
            setRecipes([])
            setHasMore(false)
            setTotalRecipes(0)
            // Don't show error message for 503 - the FallbackNotification will handle it
          }
          return
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        if (!abortController.signal.aborted) {
          // Handle the flat API response structure and missing recipes array
          const recipesArray = Array.isArray(data.recipes) ? data.recipes : []
          const recipesWithSavedStatus = recipesArray.map((recipe: any) => ({
            ...recipe,
            isSaved: recipe.saved || false, // Map 'saved' to 'isSaved' for UI consistency
            images: {
              main: recipe.images?.main || '',
              thumbnail: recipe.images?.thumbnail || '',
            },
          }))

          setRecipes((prevRecipes) =>
            page === 1
              ? recipesWithSavedStatus
              : [...prevRecipes, ...recipesWithSavedStatus]
          )

          // Handle the flat API response structure
          // Safely extract values with fallbacks for missing properties
          const totalRecipes = typeof data.total === 'number' ? data.total : 0
          const currentPage = typeof data.page === 'number' ? data.page : 1
          const limit = typeof data.limit === 'number' ? data.limit : 20
          const loadedRecipes =
            recipesWithSavedStatus.length + (page === 1 ? 0 : recipes.length)

          // Only show "Load More" if there are actually more recipes to load
          setHasMore(totalRecipes > 0 && loadedRecipes < totalRecipes)
          setTotalRecipes(totalRecipes)

          // If no recipes are available and there's a message, it could indicate external API issues
          if (recipesArray.length === 0 && data.message) {
            // Only log if it's not the standard auth message
            if (
              !data.message.includes('external API authentication required')
            ) {
              console.info('Recommended recipes API response:', data.message)
            }
          }
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return // Don't handle errors for aborted requests
        }

        console.error('Error fetching recommended recipes:', error)
        if (!abortController.signal.aborted) {
          setSnackbar({
            open: true,
            message: 'Failed to load recommended recipes',
            severity: 'error',
          })
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchRecommendedRecipes()

    return () => {
      abortController.abort()
    }
  }, [isLoaded, isSignedIn, page, getToken])

  const handleSaveRecipe = async (recipeId: string) => {
    if (!recipeId) {
      setSnackbar({
        open: true,
        message: 'Invalid recipe ID',
        severity: 'error',
      })
      return
    }

    const recipe = recipes.find((r) => r.id === recipeId)
    if (recipe?.isSaved) {
      setSnackbar({
        open: true,
        message: 'This recipe is already saved in your collection',
        severity: 'success',
      })
      return
    }
    setSavingRecipeId(recipeId)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const token = await getToken()
      // Use API base URL for local development or production
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiBase}/api/user/recipes/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipeId }),
        signal: controller.signal,
        credentials: 'include',
      })
      clearTimeout(timeoutId)

      const data = await response.json()
      if (response.ok) {
        // Update the recipe's saved status regardless of whether it was just saved or already saved
        setRecipes(
          recipes.map((recipe) =>
            recipe.id === recipeId ? { ...recipe, isSaved: true } : recipe
          )
        )
        setSnackbar({
          open: true,
          message: data.message || 'Recipe saved successfully',
          severity: 'success',
        })
      } else {
        setSnackbar({
          open: true,
          message: data.error || 'Failed to save recipe',
          severity: 'error',
        })
      }
    } catch (error) {
      console.error('Error saving recipe:', error)
      let errorMessage = 'Failed to save recipe'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.'
        } else {
          errorMessage = error.message
        }
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
    } finally {
      setSavingRecipeId(null)
    }
  }

  const handleReportImage = async (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation()
    try {
      const token = await getToken()
      const response = await fetch(`/api/recipes/${recipeId}/report-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })
      const data = await response.json()
      if (response.ok) {
        setSnackbar({
          open: true,
          message: data.message || 'Image reported. Thank you!',
          severity: 'success',
        })
      } else {
        setSnackbar({
          open: true,
          message: data.error || data.message || 'Failed to report image',
          severity: 'error',
        })
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to report image',
        severity: 'error',
      })
    }
  }

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }
  const handleNext = () => {
    setCurrentIndex((prev) => (prev < recipes.length - 1 ? prev + 1 : prev))
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  return (
    <>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      {loading && page === 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : !recipes.length ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No recommended recipes found</Typography>
        </Paper>
      ) : (
        <>
          <Box sx={{ width: '100%', position: 'relative' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {translations.common?.recommendedRecipes || 'Recommended Recipes'}
            </Typography>
            <Box
              sx={{ position: 'relative', height: '320px', overflow: 'hidden' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  position: 'absolute',
                  transition: 'transform 0.3s ease-in-out',
                  transform: `translateX(-${currentIndex * 320}px)`,
                  gap: 2,
                  px: 5,
                }}
              >
                {recipes.map((recipe, idx) => (
                  <Card
                    key={recipe.id ?? idx}
                    sx={{
                      width: 300,
                      flexShrink: 0,
                      cursor: 'pointer',
                      position: 'relative',
                      '&:hover .report-image-btn': { opacity: 1 },
                      '&:hover': {
                        '& .recipe-overlay': { opacity: 1 },
                        '& .recipe-title': { opacity: 0 },
                        '& .recipe-title-overlay': { opacity: 1 },
                      },
                    }}
                    onClick={() => handleRecipeClick(recipe.id)}
                  >
                    <Box>
                      <IconButton
                        className="report-image-btn"
                        onClick={(e) => handleReportImage(e, recipe.id)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 2,
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <FlagIcon color="warning" fontSize="small" />
                      </IconButton>
                      <CardMedia
                        component="img"
                        height="200"
                        image={
                          recipe.images?.main ||
                          '/images/recipe-placeholder.png'
                        }
                        alt={recipe.title}
                        sx={{
                          objectFit: 'cover',
                          width: '100%',
                          height: '200px',
                          backgroundColor: 'grey.200',
                        }}
                        onError={(e: any) => {
                          e.target.src = '/images/recipe-placeholder.png'
                        }}
                      />
                    </Box>
                    <CardContent
                      className="recipe-title"
                      sx={{
                        p: 2,
                        pr: 5,
                        transition: 'opacity 0.3s ease-in-out',
                        maxWidth: '70%',
                      }}
                    >
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{
                          fontSize: '1rem',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {recipe.title}
                      </Typography>
                    </CardContent>
                    <Box
                      className="recipe-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease-in-out',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        p: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        component="div"
                        className="recipe-title-overlay"
                        sx={{
                          fontSize: '1rem',
                          lineHeight: 1.2,
                          mb: 2,
                          mt: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          opacity: 0,
                          transition: 'opacity 0.3s ease-in-out',
                          color: 'white',
                        }}
                      >
                        {recipe.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'white', fontSize: '0.875rem' }}
                      >
                        Prep Time: {recipe.prepTime} minutes
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'white',
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          mt: 1,
                        }}
                      >
                        {recipe.description}
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        sx={{
                          mt: 2,
                          backgroundColor: recipe.isSaved
                            ? '#64B5F6'
                            : '#4A90E2',
                          color: recipe.isSaved
                            ? 'rgba(255, 255, 255, 0.7)'
                            : 'white',
                          '&:hover': {
                            backgroundColor: recipe.isSaved
                              ? '#42A5F5'
                              : '#357ABD',
                          },
                          '&.Mui-disabled': {
                            backgroundColor: '#64B5F6',
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveRecipe(recipe.id)
                        }}
                        disabled={
                          savingRecipeId === recipe.id || recipe.isSaved
                        }
                      >
                        {savingRecipeId === recipe.id ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : recipe.isSaved ? (
                          'Recipe Saved'
                        ) : (
                          'Save Recipe'
                        )}
                      </Button>
                    </Box>
                  </Card>
                ))}
              </Box>
            </Box>
            {recipes.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrev}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                  }}
                >
                  <NavigateBeforeIcon />
                </IconButton>
                <IconButton
                  onClick={handleNext}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                  }}
                >
                  <NavigateNextIcon />
                </IconButton>
              </>
            )}
          </Box>
          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                onClick={loadMore}
                disabled={loading}
                variant="contained"
                color="primary"
              >
                {loading ? <CircularProgress size={24} /> : 'Load More'}
              </Button>
            </Box>
          )}
        </>
      )}
    </>
  )
}
