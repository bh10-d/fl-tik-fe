import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { influencerService } from '@/services/influencer.service'
import { ApiError } from '@/lib/api-client'
import { useApp } from '@/context/AppContext'
import { Loader2 } from 'lucide-react'

interface AddInfluencerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddInfluencerDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddInfluencerDialogProps) {
  const { triggerRefresh } = useApp()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [category, setCategory] = useState('Beauty & Skincare')
  const [followers, setFollowers] = useState('250000')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUsername = username.replace(/^@/, '').trim()
    if (!cleanUsername) {
      setError('Please provide a valid TikTok username')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await influencerService.createInfluencer({
        username: cleanUsername,
        displayName: displayName.trim() || cleanUsername,
        profileUrl: `https://www.tiktok.com/@${cleanUsername}`,
        avatarUrl:
          avatarUrl.trim() ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        followers: Number(followers) || 100000,
        category,
      })

      // Reset and close
      setUsername('')
      setDisplayName('')
      setAvatarUrl('')
      setError('')
      triggerRefresh()
      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to create creator')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add TikTok Shop Creator</DialogTitle>
            <DialogDescription>
              Start tracking promotional videos and product links for a US creator.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4 text-xs">
            {error && (
              <div className="rounded-md bg-destructive/15 p-2 text-destructive font-medium text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username">TikTok Username *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                  @
                </span>
                <Input
                  id="username"
                  placeholder="creator_handle"
                  className="pl-7"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError('')
                  }}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g. Jessica Miller"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beauty & Skincare">Beauty & Skincare</SelectItem>
                    <SelectItem value="Fashion & Apparel">Fashion & Apparel</SelectItem>
                    <SelectItem value="Tech & Gadgets">Tech & Gadgets</SelectItem>
                    <SelectItem value="Home & Kitchen">Home & Kitchen</SelectItem>
                    <SelectItem value="Health & Fitness">Health & Fitness</SelectItem>
                    <SelectItem value="Food & Cooking">Food & Cooking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="followers">Estimated Followers</Label>
                <Input
                  id="followers"
                  type="number"
                  placeholder="250000"
                  value={followers}
                  onChange={(e) => setFollowers(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
              <Input
                id="avatarUrl"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Adding...' : 'Start Tracking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

