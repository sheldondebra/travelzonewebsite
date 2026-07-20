<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportTicket extends Model
{
    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'subject',
        'message',
        'category',
        'priority',
        'status',
        'admin_notes',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ticketNumber(): string
    {
        return '#TKT-'.str_pad((string) $this->id, 4, '0', STR_PAD_LEFT);
    }
}
