'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Users, Clock, CheckCheck, AlertCircle, Loader2, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { BusinessSidebar } from '@/components/layout/BusinessSidebar';
import { TopNavigation } from '@/components/layout/TopNavigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Message {
  id: string;
  content: string;
  messageType: 'DIRECT' | 'BROADCAST' | 'ANNOUNCEMENT';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: User;
  receiver: User | null;
  shop?: {
    id: string;
    name: string;
    code: string;
  };
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [broadcastTo, setBroadcastTo] = useState<string>('DIRECT');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [unreadCount, setUnreadCount] = useState(0);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopIdLoading, setShopIdLoading] = useState(true);
  const [shopIdError, setShopIdError] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Get shopId based on user role
  useEffect(() => {
    const fetchShopId = async () => {
      setShopIdLoading(true);
      setShopIdError(null);
      
      if (session?.user?.role === 'SHOP_OWNER') {
        try {
          const response = await fetch('/api/shops');
          const data = await response.json();
          console.log('Shop API Response:', data); // Debug log
          
          if (data.shops && data.shops.length > 0) {
            setShopId(data.shops[0].id);
            console.log('Shop Owner - ShopId loaded:', data.shops[0].id);
          } else {
            console.error('No shops found in response:', data);
            setShopIdError('No shop found for this owner');
          }
        } catch (error) {
          console.error('Error fetching shop:', error);
          setShopIdError('Failed to load shop information');
        }
      } else if (session?.user?.role === 'SHOP_WORKER') {
        try {
          const response = await fetch('/api/workers/my-permissions');
          const data = await response.json();
          console.log('Worker permissions response:', data);
          
          if (data.success && data.shopId) {
            setShopId(data.shopId);
            console.log('Shop Worker - ShopId loaded:', data.shopId);
          } else {
            setShopIdError('Worker not assigned to any shop');
          }
        } catch (error) {
          console.error('Error fetching worker info:', error);
          setShopIdError('Failed to load worker information');
        }
      } else if (session?.user?.role === 'SUPER_ADMIN') {
        // Super Admin doesn't need shopId
        console.log('Super Admin - No shopId needed');
      }
      
      setShopIdLoading(false);
    };

    if (session) {
      fetchShopId();
    }
  }, [session]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!shopId && session?.user?.role !== 'SUPER_ADMIN') return;

    try {
      // Build URL with shopId parameter
      const params = new URLSearchParams();
      if (shopId) params.append('shopId', shopId);
      if (selectedUser) params.append('userId', selectedUser);
      
      const url = `/api/messages?${params.toString()}`;
      console.log('Fetching messages from:', url);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error('Failed to fetch messages:', data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId, selectedUser, session]);

  // Fetch available users
  const fetchUsers = useCallback(async () => {
    if (!shopId && session?.user?.role !== 'SUPER_ADMIN') return;

    try {
      const url = shopId 
        ? `/api/messages/users?shopId=${shopId}`
        : '/api/messages/users';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [shopId, session]);

  // Initial load
  useEffect(() => {
    if (shopId || session?.user?.role === 'SUPER_ADMIN') {
      fetchMessages();
      fetchUsers();
    }
  }, [shopId, session, fetchMessages, fetchUsers]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!shopId && session?.user?.role !== 'SUPER_ADMIN') return;

    const interval = setInterval(() => {
      fetchMessages();
    }, 30000);

    return () => clearInterval(interval);
  }, [shopId, session, fetchMessages]);

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
      });
      
      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    if ((!broadcastTo || broadcastTo === 'DIRECT') && !selectedUser) {
      toast({
        title: 'Error',
        description: 'Please select a recipient or broadcast option',
        variant: 'destructive',
      });
      return;
    }

    // Check if shopId is required
    if (session?.user?.role !== 'SUPER_ADMIN') {
      if (shopIdLoading) {
        toast({
          title: 'Please Wait',
          description: 'Shop information is still loading...',
          variant: 'default',
        });
        return;
      }
      
      if (!shopId) {
        toast({
          title: 'Error',
          description: shopIdError || 'Shop information not loaded. Please refresh the page.',
          variant: 'destructive',
        });
        return;
      }
    }

    setSending(true);

    try {
      const payload: any = {
        content: newMessage,
        priority,
      };

      // Determine message type and recipients
      if (broadcastTo && broadcastTo !== 'DIRECT') {
        // Broadcast message
        payload.messageType = 'BROADCAST';
        payload.broadcastTo = broadcastTo;
      } else if (selectedUser) {
        // Direct message to specific user
        payload.messageType = 'DIRECT';
        payload.receiverId = selectedUser;
      }

      // Include shopId for non-Super Admin users
      if (session?.user?.role !== 'SUPER_ADMIN' && shopId) {
        payload.shopId = shopId;
      }

      console.log('Sending message with payload:', payload);

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: broadcastTo && broadcastTo !== 'DIRECT'
            ? `Message broadcasted to ${data.messagesSent} recipient(s)`
            : 'Message sent successfully',
        });

        setNewMessage('');
        setBroadcastTo('DIRECT');
        setPriority('NORMAL');
        setSelectedUser('');
        fetchMessages();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send message',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get message type badge
  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case 'BROADCAST':
        return <Badge variant="outline" className="ml-2">Broadcast</Badge>;
      case 'ANNOUNCEMENT':
        return <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Announcement</Badge>;
      default:
        return null;
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <BusinessSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className={`flex-1 min-h-screen bg-gray-50 dark:bg-gray-900 ${isMobileSidebarOpen ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        {/* Top Navigation */}
        <TopNavigation onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
              <div className="flex justify-between items-start md:items-center gap-3">
                <div className="flex items-start md:items-center gap-3 flex-1">
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 md:gap-3">
                      <div className="bg-gradient-to-br from-purple-500 to-blue-600 dark:from-purple-600 dark:to-blue-700 p-2 md:p-3 rounded-lg md:rounded-xl shadow-lg">
                        <MessageSquare className="h-5 w-5 md:h-7 md:w-7 text-white" />
                      </div>
                      <span className="hidden sm:inline">Messages</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 md:mt-2">
                      Communicate with your team in real-time
                    </p>
                  </div>
                </div>
                
                {unreadCount > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-2 sm:px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-red-200 dark:border-red-800 flex-shrink-0">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-400">
                      {unreadCount} <span className="hidden sm:inline">Unread</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shop Loading/Error State */}
            {shopIdLoading && session?.user?.role !== 'SUPER_ADMIN' && (
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-300" />
                    </div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Loading shop information...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {shopIdError && session?.user?.role !== 'SUPER_ADMIN' && (
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 dark:bg-red-800 p-2 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                        {shopIdError}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-200 mt-1">
                        Please contact your administrator or refresh the page.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Message Compose */}
              <Card className="lg:col-span-1 shadow-lg border-none dark:border-gray-700 overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 dark:from-blue-600 dark:via-blue-700 dark:to-indigo-700 text-white border-none p-4">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <Send className="h-5 w-5" />
                    </div>
                    <span className="font-bold">New Message</span>
                  </CardTitle>
                  <CardDescription className="text-blue-50 dark:text-blue-100">
                    Send a message or broadcast
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-white dark:bg-gray-900 p-6">
                  {/* Recipient Selection */}
                  {session.user.role === 'SUPER_ADMIN' && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Broadcast To</label>
                      <Select value={broadcastTo} onValueChange={setBroadcastTo}>
                        <SelectTrigger className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-200 bg-white dark:bg-gray-700">
                          <SelectValue placeholder="Select broadcast option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIRECT">None (Direct Message)</SelectItem>
                          <SelectItem value="ALL_OWNERS">All Shop Owners</SelectItem>
                          <SelectItem value="ALL_WORKERS">All Workers</SelectItem>
                          <SelectItem value="ALL_USERS">All Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {session.user.role === 'SHOP_OWNER' && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Broadcast To</label>
                      <Select value={broadcastTo} onValueChange={setBroadcastTo}>
                        <SelectTrigger className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-200 bg-white dark:bg-gray-700">
                          <SelectValue placeholder="Select broadcast option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIRECT">None (Direct Message)</SelectItem>
                          <SelectItem value="SHOP_WORKERS">All My Workers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(!broadcastTo || broadcastTo === 'DIRECT') && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Send To</label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-200 bg-white dark:bg-gray-700">
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Priority */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Priority</label>
                    <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                      <SelectTrigger className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-200 bg-white dark:bg-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Message</label>
                    <Textarea
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={6}
                      className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-200 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || (shopIdLoading && session?.user?.role !== 'SUPER_ADMIN') || (shopIdError !== null && session?.user?.role !== 'SUPER_ADMIN')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : shopIdLoading && session?.user?.role !== 'SUPER_ADMIN' ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Messages List */}
              <Card className="lg:col-span-2 shadow-lg border-none dark:border-gray-700 overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 dark:from-purple-600 dark:via-purple-700 dark:to-pink-700 text-white border-none p-4">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="font-bold">Conversations</span>
                  </CardTitle>
                  <CardDescription className="text-purple-50 dark:text-purple-100">
                    Your conversation history
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-white dark:bg-gray-900 p-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-full mb-4 shadow-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-6 rounded-full mb-4">
                        <MessageSquare className="h-14 w-14 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">No messages yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                        Start a conversation by sending your first message using the form above
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-300 hover:scrollbar-thumb-purple-400 dark:scrollbar-thumb-purple-700 dark:hover:scrollbar-thumb-purple-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                      {messages.map((message) => {
                        const isOwnMessage = message.sender.id === session.user.id;
                        const isBroadcast = message.messageType === 'BROADCAST' || message.messageType === 'ANNOUNCEMENT';
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                              {/* Message Bubble */}
                              <div
                                className={`rounded-2xl px-4 py-3 ${
                                  isBroadcast
                                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md'
                                    : isOwnMessage
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
                                    : !message.isRead
                                    ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-300 dark:border-green-700 shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-700 text-foreground shadow-sm'
                                }`}
                              >
                                {/* Header - Only show for incoming messages or broadcasts */}
                                {(!isOwnMessage || isBroadcast) && (
                                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20 dark:border-gray-600">
                                    <span className={`font-semibold text-sm ${
                                      isBroadcast || isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                                    }`}>
                                      {message.sender.name}
                                    </span>
                                    {getMessageTypeBadge(message.messageType)}
                                    <Badge className={`${getPriorityColor(message.priority)} ml-auto`}>
                                      {message.priority}
                                    </Badge>
                                  </div>
                                )}

                                {/* Priority badge for own messages (top right) */}
                                {isOwnMessage && !isBroadcast && (
                                  <div className="flex justify-between items-center mb-2">
                                    {message.receiver && (
                                      <span className="text-xs text-white/80">
                                        To: {message.receiver.name}
                                      </span>
                                    )}
                                    <Badge className={`${getPriorityColor(message.priority)} ml-auto`}>
                                      {message.priority}
                                    </Badge>
                                  </div>
                                )}

                                {/* Shop Badge for Super Admin */}
                                {session.user.role === 'SUPER_ADMIN' && message.shop && (
                                  <div className="mb-2">
                                    <Badge variant="outline" className="text-xs bg-white/20 border-white/40">
                                      {message.shop.name}
                                    </Badge>
                                  </div>
                                )}

                                {/* Message Content */}
                                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                  isBroadcast || isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {message.content}
                                </p>

                                {/* Footer */}
                                <div className={`flex items-center gap-2 mt-2 text-xs ${
                                  isBroadcast || isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatDistanceToNow(new Date(message.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                  {!message.isRead && !isOwnMessage && (
                                    <Badge className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5">
                                      New
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Mark as Read Button */}
                              {!message.isRead && !isOwnMessage && (
                                <div className="mt-2 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                                    onClick={() => markAsRead(message.id)}
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1.5" />
                                    Mark as Read
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
