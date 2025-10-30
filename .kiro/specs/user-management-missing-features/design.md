# User Management Missing Features - Technical Design

## Overview

This design document outlines the technical implementation for the missing user management features in the Shop Management System. The design builds upon the existing architecture while adding comprehensive CRUD operations, status management, and advanced user administration capabilities.

## Architecture

### Current System Analysis

The existing system has:
- Next.js 14 with App Router
- Prisma ORM with PostgreSQL
- NextAuth.js for authentication
- React components with TypeScript
- Tailwind CSS for styling
- Role-based access control (SUPER_ADMIN, SHOP_OWNER, SHOP_WORKER)

### Enhanced Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│ User Management Components                                  │
│ ├── EditUserDialog                                         │
│ ├── UserStatusToggle                                       │
│ ├── PasswordResetDialog                                    │
│ ├── RoleChangeDialog                                       │
│ ├── UserActivityLog                                        │
│ ├── BulkUserActions                                        │
│ ├── UserSearchFilters                                      │
│ └── PermissionManager                                      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                               │
├─────────────────────────────────────────────────────────────┤
│ User Management Endpoints                                   │
│ ├── PUT /api/users/[id]           - Update user profile    │
│ ├── PATCH /api/users/[id]/status  - Change user status     │
│ ├── POST /api/users/[id]/reset    - Reset password         │
│ ├── PATCH /api/users/[id]/role    - Change user role       │
│ ├── GET /api/users/[id]/activity  - Get user activity      │
│ ├── POST /api/users/bulk          - Bulk operations        │
│ ├── GET /api/users/search         - Advanced search        │
│ └── PATCH /api/users/[id]/perms   - Manage permissions     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│ Enhanced Schema                                             │
│ ├── User (enhanced with status, lastLogin, etc.)          │
│ ├── UserActivity (new table for activity tracking)        │
│ ├── UserPermissions (new table for worker permissions)    │
│ ├── AuditLog (enhanced for user operations)               │
│ └── PasswordReset (new table for reset tokens)            │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced User Interface

```typescript
// Enhanced User type with additional fields
interface User {
  id: string
  name: string
  email: string
  phone: string
  cnic: string
  address: string
  city: string
  province: string
  role: 'SUPER_ADMIN' | 'SHOP_OWNER' | 'SHOP_WORKER'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  businessName?: string
  shopId?: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
  emailVerified: boolean
  mustChangePassword: boolean
  permissions?: UserPermission[]
}

interface UserPermission {
  id: string
  userId: string
  feature: string
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
}

interface UserActivity {
  id: string
  userId: string
  action: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: string
}
```

### 2. EditUserDialog Component

```typescript
interface EditUserDialogProps {
  user: User | null
  open: boolean
  onClose: () => void
  onSuccess: (updatedUser: User) => void
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  user,
  open,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<Partial<User>>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form sections:
  // - Personal Information (name, email, phone, cnic)
  // - Address Information (address, city, province)
  // - Business Information (businessName for shop owners)
  // - System Information (role, status) - Admin only
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        onSuccess(updatedUser)
        onClose()
      } else {
        const error = await response.json()
        setErrors(error.errors || { general: error.message })
      }
    } catch (error) {
      setErrors({ general: 'Failed to update user' })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    // Modal with form sections for different user information
    // Include role-based field visibility
    // Add validation and error handling
  )
}
```

### 3. UserStatusToggle Component

```typescript
interface UserStatusToggleProps {
  user: User
  onStatusChange: (user: User, newStatus: User['status']) => void
}

const UserStatusToggle: React.FC<UserStatusToggleProps> = ({
  user,
  onStatusChange
}) => {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleStatusChange = async (newStatus: User['status']) => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        onStatusChange(updatedUser, newStatus)
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant={user.status === 'ACTIVE' ? 'success' : 'secondary'}>
        {user.status}
      </Badge>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
      >
        Toggle Status
      </Button>
      
      {showConfirm && (
        <ConfirmDialog
          title="Change User Status"
          message={`Are you sure you want to ${user.status === 'ACTIVE' ? 'deactivate' : 'activate'} this user?`}
          onConfirm={() => handleStatusChange(user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
```

### 4. PasswordResetDialog Component

```typescript
interface PasswordResetDialogProps {
  user: User | null
  open: boolean
  onClose: () => void
  onSuccess: (credentials: { email: string; password: string }) => void
}

const PasswordResetDialog: React.FC<PasswordResetDialogProps> = ({
  user,
  open,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  
  const handleReset = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/users/${user?.id}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const { temporaryPassword } = await response.json()
        setNewPassword(temporaryPassword)
        onSuccess({ email: user!.email, password: temporaryPassword })
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false)
    }
  }
  
  return (
    // Modal with password reset confirmation
    // Display new credentials securely
    // Include copy-to-clipboard functionality
  )
}
```

## Data Models

### 1. Enhanced User Schema

```prisma
model User {
  id                String    @id @default(cuid())
  name              String
  email             String    @unique
  phone             String
  cnic              String    @unique
  address           String
  city              String
  province          String
  role              Role
  status            UserStatus @default(ACTIVE)
  businessName      String?
  shopId            String?
  password          String
  emailVerified     Boolean   @default(false)
  mustChangePassword Boolean  @default(false)
  lastLogin         DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  shop              Shop?     @relation(fields: [shopId], references: [id])
  ownedShops        Shop[]    @relation("ShopOwner")
  activities        UserActivity[]
  permissions       UserPermission[]
  passwordResets    PasswordReset[]
  auditLogs         AuditLog[] @relation("AuditLogUser")
  performedAudits   AuditLog[] @relation("AuditLogPerformer")
  
  @@map("users")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

### 2. User Activity Schema

```prisma
model UserActivity {
  id          String   @id @default(cuid())
  userId      String
  action      String   // LOGIN, LOGOUT, PROFILE_UPDATE, PASSWORD_CHANGE, etc.
  details     Json?    // Additional context about the action
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, timestamp])
  @@map("user_activities")
}
```

### 3. User Permissions Schema

```prisma
model UserPermission {
  id        String  @id @default(cuid())
  userId    String
  feature   String  // POS, INVENTORY, REPORTS, CUSTOMERS, etc.
  canRead   Boolean @default(true)
  canWrite  Boolean @default(false)
  canDelete Boolean @default(false)
  
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, feature])
  @@map("user_permissions")
}
```

### 4. Password Reset Schema

```prisma
model PasswordReset {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("password_resets")
}
```

## API Endpoints Design

### 1. User Profile Update

```typescript
// PUT /api/users/[id]/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // Permission check
    const canEdit = await checkUserEditPermission(session.user, params.id)
    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)
    
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: validatedData
    })
    
    // Log the activity
    await logUserActivity({
      userId: session.user.id,
      action: 'USER_PROFILE_UPDATED',
      details: { targetUserId: params.id, changes: validatedData }
    })
    
    return NextResponse.json(updatedUser)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 2. User Status Management

```typescript
// PATCH /api/users/[id]/status/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { status, reason } = await request.json()
    
    // Validate status change permissions
    const canChangeStatus = await checkStatusChangePermission(session.user, params.id)
    if (!canChangeStatus) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { status }
    })
    
    // Handle cascading effects (e.g., deactivate workers when shop owner is deactivated)
    if (status === 'INACTIVE' && updatedUser.role === 'SHOP_OWNER') {
      await prisma.user.updateMany({
        where: { shopId: { in: updatedUser.ownedShops.map(shop => shop.id) } },
        data: { status: 'INACTIVE' }
      })
    }
    
    // Log the activity
    await logUserActivity({
      userId: session.user.id,
      action: 'USER_STATUS_CHANGED',
      details: { targetUserId: params.id, newStatus: status, reason }
    })
    
    return NextResponse.json(updatedUser)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 3. Password Reset

```typescript
// POST /api/users/[id]/reset/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // Only admins and shop owners (for their workers) can reset passwords
    const canReset = await checkPasswordResetPermission(session.user, params.id)
    if (!canReset) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    // Generate secure temporary password
    const temporaryPassword = generateSecurePassword()
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12)
    
    // Update user with new password and force change flag
    await prisma.user.update({
      where: { id: params.id },
      data: {
        password: hashedPassword,
        mustChangePassword: true
      }
    })
    
    // Create password reset record
    await prisma.passwordReset.create({
      data: {
        userId: params.id,
        token: generateResetToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    })
    
    // Log the activity
    await logUserActivity({
      userId: session.user.id,
      action: 'PASSWORD_RESET',
      details: { targetUserId: params.id }
    })
    
    // Send email notification (optional)
    await sendPasswordResetEmail(params.id, temporaryPassword)
    
    return NextResponse.json({ temporaryPassword })
  } catch (error) {
    return handleApiError(error)
  }
}
```

## Error Handling

### 1. Validation Schemas

```typescript
import { z } from 'zod'

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+92-\d{3}-\d{7}$/),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/),
  address: z.string().min(10).max(200),
  city: z.string().min(2).max(50),
  province: z.string().min(2).max(50),
  businessName: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'SHOP_OWNER', 'SHOP_WORKER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional()
})

export const statusChangeSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  reason: z.string().optional()
})
```

### 2. Permission Checking

```typescript
export async function checkUserEditPermission(
  currentUser: any,
  targetUserId: string
): Promise<boolean> {
  // Super admin can edit anyone
  if (currentUser.role === 'SUPER_ADMIN') return true
  
  // Users can edit themselves
  if (currentUser.id === targetUserId) return true
  
  // Shop owners can edit their workers
  if (currentUser.role === 'SHOP_OWNER') {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })
    
    if (targetUser?.shopId && currentUser.ownedShops?.includes(targetUser.shopId)) {
      return true
    }
  }
  
  return false
}
```

## Testing Strategy

### 1. Unit Tests

```typescript
// Test API endpoints
describe('User Management API', () => {
  describe('PUT /api/users/[id]', () => {
    it('should update user profile with valid data', async () => {
      const response = await request(app)
        .put('/api/users/user123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com'
        })
      
      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Updated Name')
    })
    
    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .put('/api/users/user123')
        .send({ name: 'Updated Name' })
      
      expect(response.status).toBe(401)
    })
  })
})
```

### 2. Integration Tests

```typescript
// Test complete workflows
describe('User Management Workflows', () => {
  it('should complete user edit workflow', async () => {
    // 1. Login as admin
    const { token } = await loginAsAdmin()
    
    // 2. Get user list
    const users = await getUserList(token)
    const testUser = users[0]
    
    // 3. Edit user
    const updatedUser = await editUser(token, testUser.id, {
      name: 'New Name'
    })
    
    // 4. Verify changes
    expect(updatedUser.name).toBe('New Name')
    
    // 5. Verify audit log
    const auditLogs = await getAuditLogs(token, testUser.id)
    expect(auditLogs[0].action).toBe('USER_PROFILE_UPDATED')
  })
})
```

This design provides a comprehensive foundation for implementing all the missing user management features while maintaining security, performance, and usability standards.