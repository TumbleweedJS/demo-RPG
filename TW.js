/*
Copyright (c) 2013, Tumbleweed Studio
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of TumbleweedJS nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
/**
 * @module Collision
 * @namespace Collision
 */

var TW = TW || {};

(function(TW) {

    TW.Collision = TW.Collision ||  {};
    TW.Collision.CollisionBox = CollisionBox;

    if (typeof window.define === "function" && window.define.amd) {
        define('collision/CollisionBox',[], function() {
            return CollisionBox;
        });
    }

    /**
     * The CollisionBox class allow you to declare a bounding box to test collisions between
     * other collisions boxes and collisions circles.
     *
     * @class CollisionBox
     * @param {Integer} x the x coordinate of the collision box
     * @param {Integer} y the y coordinate of the collision box
     * @param {Integer} w the width of the collision box
     * @param {Integer} h the height of the collision box
     * @constructor
     */
    function CollisionBox(x, y, w, h) {
        this.type = "CollisionBox";
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.x_centerPoint = 0;
        this.y_centerPoint = 0;
        this.angle = 0;
        this.debug_mode = false;
    }


    /**
     The isPointInside method allow you to test if a point is inside the bouncing box.
     @method isPointInside
     @param {Integer} px the x coordinate of the point
     @param {Integer} py the y coordinate of the point
     @return {boolean} true if the point is inside the box, else return false.
     */
    CollisionBox.prototype.isPointInside = function(px, py) {
        return px >= this.getX() && px <= this.getX() + this.getWidth() &&
            py >= this.getY() && py <= this.getY() + this.getHeight();
    };

    /**
     The isSegmentCollidingCircle method allow you to test if a segment is colliding a circle
     @method isSegmentCollidingCircle
     @param {Integer} a_x the x coordinate of the first point of the segment
     @param {Integer} a_y the y coordinate of the first point of the segment
     @param {Integer} b_x the x coordinate of the second point of the segment
     @param {Integer} b_y the y coordinate of the second point of the segment
     @param {CollisionCircle} circle the CollisionCircle object to test collision with the segment
     @return {boolean} return true if circle and the segment are colliding, else return false.
     */
    CollisionBox.prototype.isSegmentCollidingCircle = function(a_x, a_y, b_x, b_y, circle) {
        var v_x = b_x - a_x;
        var v_y = b_y - a_y;
        var radius = circle.getRadius();
        a_x -= circle.getX();
        a_y -= circle.getY();
        var delta = (((2 * a_x * v_x) + (2 * a_y * v_y)) * ((2 * a_x * v_x) + (2 * a_y * v_y))) -
            (4 * ((v_x * v_x) + (v_y * v_y)) * ((a_x * a_x) + (a_y * a_y) - (radius * radius)));
        if (delta >= 0) {
            if ((((2 * a_x * v_x + 2 * a_y * v_y) * -1) + (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) <
                1.0 &&
                (((2 * a_x * v_x + 2 * a_y * v_y) * -1) + (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) >
                    0.0) {
                return true;
            }
            if ((((2 * a_x * v_x + 2 * a_y * v_y) * -1) - (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) <
                1.0 &&
                (((2 * a_x * v_x + 2 * a_y * v_y) * -1) - (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) >
                    0.0) {
                return true;
            }
        }
        return false;
    };

    /**
     * The isCollidingCircle method allow you to test if the current CollisionBox
     * is colliding the CollisionCircle object.
     *
     * @method isCollidingCircle
     * @param {CollisionCircle} circle the CollisionCircle object to test the collision with.
     * @return {boolean} if the current CollisionBox is colliding the CollisionCircle object,
     *  then the isCollidingCircle function will return true otherwise it will return false.
     */
    CollisionBox.prototype.isCollidingCircle = function(circle) {
        var radius = circle.getRadius();

        //On check si la boite englobante du cercle rentre en collision avec this
        if (circle.getX() + radius < this.x) {
            return false;
        }
        if (circle.getX() - radius > this.x + this.w) {
            return false;
        }
        if (circle.getY() + radius < this.y) {
            return false;
        }
        if (circle.getY()- radius > this.y + this.h) {
            return false;
        }
        //On check si un des segments de la box rentre en collision avec le cercle
        if (this.isSegmentCollidingCircle(this.x, this.y, this.x + this.w, this.y, circle)) {
            return true;
        }
        if (this.isSegmentCollidingCircle(this.x + this.w, this.y, this.x + this.w, this.y + this.h, circle)) {
            return true;
        }
        if (this.isSegmentCollidingCircle(this.x + this.w, this.y + this.h, this.x, this.y + this.h, circle)) {
            return true;
        }
        if (this.isSegmentCollidingCircle(this.x, this.y + this.h, this.x, this.y, circle)) {
            return true;
        }
        //On check si le centre du cercle est dans la box.
        if (circle.getX() > this.x && circle.getX() < this.x + this.w && circle.getY() > this.y &&
            circle.getY() < this.y + this.h) {
            return true;
        }
        //on check si les sommets de la box sont a une distance plus petite que le rayon du cercle
        if (Math.sqrt(((this.x - circle.getX()) * (this.x - circle.getX())) +
            ((this.y - circle.getY()) * (this.y - circle.getY()))) < radius) {
            return true;
        }
        if (Math.sqrt(((this.x + this.w - circle.getX()) * (this.x + this.w - circle.getX())) +
            ((this.y - circle.getY()) * (this.y - circle.getY()))) < radius) {
            return true;
        }
        if (Math.sqrt(((this.x + this.w - circle.getX()) * (this.x + this.w - circle.getX())) +
            ((this.y + this.h - circle.getY()) * (this.y + this.h - circle.getY()))) < radius) {
            return true;
        }
        if (Math.sqrt(((this.x - circle.getX()) * (this.x - circle.getX())) +
            ((this.y + this.h - circle.getY()) * (this.y + this.h - circle.getY()))) < radius) {
            return true;
        }
        return false;
    };

    /**
     * The isCollidingBox method allow you to test if the current CollisionBox object is colliding
     * the CollisionBox object given in parameter.
     *
     * @method isCollidingBox
     * @param {CollisionBox} box the CollisionBox object to test the collision with
     * @return {Boolean} return true if the box object is colliding the this object.
     */
    CollisionBox.prototype.isCollidingBox = function(box) {
        var box_x = box.getX();
        var box_y = box.getY();
        var box_width = box.getWidth();
        var box_height = box.getHeight();

        if (this.x + this.w < box_x) {
            return false;
        }
        if (this.x > box_x + box_width) {
            return false;
        }
        if (this.y + this.h < box_y) {
            return false;
        }
        if (this.y > box_y + box_height) {
            return false;
        }
        return true;
    };

    /**
     This method allow you to set the x coordinate of the CollisionBox
     @method setX
     @param {Integer} val the x coordinate of the CollisionBox
     */
    CollisionBox.prototype.setX = function(val) {
        this.x = val;
    };

    /**
     This method allow you to get the x coordinate of the CollisionBox
     @method getX
     @return {Integer} return the value of the x coordinate of the CollisionBox
     */
    CollisionBox.prototype.getX = function() {
        return this.x;
    };

    /**
     This method allow you to set the y coordinate of the CollisionBox
     @method setY
     @param {Integer} val the y coordinate of the CollisionBox
     */
    CollisionBox.prototype.setY = function(val) {
        this.y = val;
    };

    /**
     This method allow you to get the y coordinate of the CollisionBox
     @method getY
     @return {Integer} return the y coordinate of the CollisionBox
     */
    CollisionBox.prototype.getY = function() {
        return this.y;
    };

    /**
     The setWidth method allow you to set the width of the CollisionBox
     @method setWidth
     @param {Integer} val the width of the CollisionBox
     */
    CollisionBox.prototype.setWidth = function(val) {
        this.w = val;
    };

    /**
     The getWidth method allow you to get the width of the CollisionBox
     @method getWidth
     @return {Integer} return the width of the CollisionBox
     */
    CollisionBox.prototype.getWidth = function() {
        return this.w;
    };

    /**
     The setHeight method allow you to set the height of the CollisionBox
     @method setHeight
     @param {Integer} val the height parameter of the CollisionBox
     */
    CollisionBox.prototype.setHeight = function(val) {
        this.h = val;
    };

    /**
     The getHeight method allow you to get the height of the CollisionBox
     @method getHeight
     @return {Integer} return the height of the CollisionBox.
     */
    CollisionBox.prototype.getHeight = function() {
        return this.h;
    };

    /**
     * The setDebug method allow you to switch the mode of the CollisionBox between debug and release.
     *
     * @method setDebug
     * @param {Integer} debug the parameter to define which type of mode choose
     * (true means debug mode, false means release)
     */
    CollisionBox.prototype.setDebug = function(debug) {
        this.debug_mode = debug;
    };

    /**
     The draw method allow you to draw the CollisionBox only if `setDebug(true)` was called before.
     @method draw
     @param {CanvasRenderingContext2D} context the context 2d on which draw the CollisionBox.
     */
    CollisionBox.prototype.draw = function(context) {
        if (context && this.debug_mode) {
            //Permet de sauvegarder le context
            context.save();
            //Set a l'identity la matrice de transformation
            context.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
            context.fillStyle = "rgb(" + 0 + ", " + 0 + ", " + 0 + ")";
            context.strokeRect(this.x, this.y, this.w, this.h);
            //Permet de restorer le context
            context.restore();
        }
    };

}(TW));

/**
 @module Collision
 @namespace Collision
 */

var TW = TW || {};

(function(TW) {

    TW.Collision = TW.Collision ||  {};
    TW.Collision.CollisionCircle = CollisionCircle;

    if (typeof window.define === "function" && window.define.amd) {
        define('collision/CollisionCircle',[], function() {
            return CollisionCircle;
        });
    }

    /**
     * The CollisionCircle class allow you to create a CollisionCircle to test intersections
     * with other collision objects like circles, segments or boxes.
     *
     * @class CollisionCircle
     * @constructor
     * @param {Integer} x the x coordinate of the CollisionCircle
     * @param {Integer} y the y coordinate of the CollisionCircle
     * @param {Integer} radius the radius of the CollisionCircle
     */
    function CollisionCircle(x, y, radius) {
        this.type = "CollisionCircle";
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.x_centerPoint = 0;
        this.y_centerPoint = 0;
        this.angle = 0;
        this.debug_mode = false;
    }


    /**
     * The method is CollidingCircle allow you to test if two circles are Colliding. Let's see an example :
     *
     *      var circle = new CollisionCircle(x, y, radius);
     *      var circle2 = new CollisionCircle(x2, y2, radius2);
     *      var result = circle.isCollidingCircle(circle2);
     *
     * If result is true, so the circle object is colliding the circle2 object.
     * If result if false, so the circle object is not colliding the circle2 object.
     * @method isCollidingCircle
     * @param {CollisionCircle} circle the CollisionCircle to test collision with.
     * @return {boolean} return true if the two circles are colliding, otherwise return false.
     */
    CollisionCircle.prototype.isCollidingCircle = function(circle) {
        var circle_x = circle.getX();
        var circle_y = circle.getY();
        var dist = Math.sqrt(((circle_x - this.x) * (circle_x - this.x)) +
            ((circle_y - this.y) * (circle_y - this.y)));

        return dist < (this.radius + circle.getRadius());
    };

    /**
     The isCollidingSegment method allow you to test if the CollisionCircle is Colliding a segment
     @method isCollidingSegment
     @param {Integer} a_x the x coordinate of the first point of the segment to test intersection with.
     @param {Integer} a_y the y coordinate of the first point of the segment to test intersection with.
     @param {Integer} b_x the x coordinate of the second point of the segment to test intersection with.
     @param {Integer} b_y the y coordinate of the second point of the segment to test intersection with.
     @return {boolean} returns true if the current CollisionCircle is colliding the segment. Otherwise return false.
     */
    CollisionCircle.prototype.isCollidingSegment = function(a_x, a_y, b_x, b_y) {
        var v_x = b_x - a_x;
        var v_y = b_y - a_y;
        var circle = this;
        var radius = circle.getRadius();
        a_x -= circle.getX();
        a_y -= circle.getY();
        var delta = (((2 * a_x * v_x) + (2 * a_y * v_y)) * ((2 * a_x * v_x) + (2 * a_y * v_y))) -
            (4 * ((v_x * v_x) + (v_y * v_y)) * ((a_x * a_x) + (a_y * a_y) - (radius * radius)));
        if (delta >= 0) {
            if ((((2 * a_x * v_x + 2 * a_y * v_y) * -1) + (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) <
                1.0 &&
                (((2 * a_x * v_x + 2 * a_y * v_y) * -1) + (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) >
                    0.0) {
                return true;
            }
            if ((((2 * a_x * v_x + 2 * a_y * v_y) * -1) - (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) <
                1.0 &&
                (((2 * a_x * v_x + 2 * a_y * v_y) * -1) - (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) >
                    0.0) {
                return true;
            }
        }
        return false;
    };


    /**
     The isPointInside method allow you to test if a point is inside the current circle
     @method isPointInside
     @param {Integer} px the x coordinate of the point
     @param {Integer} py the y coordinate of the point
     @return {boolean} return true if the point is inside the Circle, otherwise it returns false.
     */
    CollisionCircle.prototype.isPointInside = function(px, py) {
        px -= this.getX();
        py -= this.getY();
        return Math.sqrt((px * px) + (py * py)) <= this.getRadius();
    };

    /**
     * The isCollidingBox method allow you to test if the current CollisionCircle
     * is colliding the CollidingBox in parameter.
     *
     * @method isCollidingBox
     * @param {CollisionBox} box the CollidingBox to test collision with.
     * @return {boolean} returns true if the current CollisionCircle is colliding the box;
     *  otherwise, it returns false
     */
    CollisionCircle.prototype.isCollidingBox = function(box) {
        //On check si la boite englobante du cercle rentre en collision avec this
        if (this.x + this.radius < box.getX()) {
            return false;
        }
        if (this.x - this.radius > box.getX() + box.getWidth()) {
            return false;
        }
        if (this.y + this.radius < box.getY()) {
            return false;
        }
        if (this.y - this.radius > box.getY() + box.getHeight()) {
            return false;
        }
        //On check si les segments de la boite rentrent en collision avec le cercle
        if (this.isCollidingSegment(box.getX(), box.getY(), box.getX() + box.getWidth(), box.getY())) {
            return true;
        }
        if (this.isCollidingSegment(box.getX() + box.getWidth(), box.getY(), box.getX() + box.getWidth(),
            box.getY() + box.getHeight())) {
            return true;
        }
        if (this.isCollidingSegment(box.getX() + box.getWidth(), box.getY() + box.getHeight(), box.getX(),
            box.getY() + box.getHeight())) {
            return true;
        }
        if (this.isCollidingSegment(box.getX(), box.getY() + box.getHeight(), box.getX(), box.getY())) {
            return true;
        }
        //On check si le centre du cercle est dans la box.
        if (this.getX() > box.getX() && this.getX() < box.getX() + box.getWidth() && this.getY() > box.getY() &&
            this.getY() < box.getY() + box.getHeight()) {
            return true;
        }
        //on check si les sommets de la box sont a une distance plus petite que le rayon du cercle
        if (Math.sqrt(((box.getX() - this.getX()) * (box.getX() - this.getX())) +
            ((box.getY() - this.getY()) * (box.getY() - this.getY()))) < this.radius) {
            return true;
        }
        if (Math.sqrt(((box.getX() + box.getWidth() - this.getX()) * (box.getX() + box.getWidth() - this.getX())) +
            ((box.getY() - this.getY()) * (box.getY() - this.getY()))) < this.radius) {
            return true;
        }
        if (Math.sqrt(((box.getX() + box.getWidth() - this.getX()) * (box.getX() + box.getWidth() - this.getX())) +
            ((box.getY() + box.getHeight() - this.getY()) * (box.getY() + box.getHeight() - this.getY()))) <
            this.radius) {
            return true;
        }
        if (Math.sqrt(((box.getX() - this.getX()) * (box.getX() - this.getX())) +
            ((box.getY() + box.getHeight() - this.getY()) * (box.getY() + box.getHeight() - this.getY()))) <
            this.radius) {
            return true;
        }
        return false;
    };

    /**
     the setX method allow you to set the x coordinate of the CollisionCircle
     @method setX
     @param {Integer} val the x value to set.
     */
    CollisionCircle.prototype.setX = function(val) {
        this.x = val;
    };

    /**
     the getX method allow you to get the x coordinate of the CollisionCircle
     @method getX
     @return {Integer} the x coordinate of the CollisionCircle
     */
    CollisionCircle.prototype.getX = function() {
        return this.x;
    };

    /**
     the setY method allow you to set the y coordinate of the CollisionCircle
     @method setY
     @param {Integer} val the y coordinate of the CollisionCircle.
     */
    CollisionCircle.prototype.setY = function(val) {
        this.y = val;
    };

    /**
     the getY method allow you to get the y coordinate of the CollisionCircle
     @method getY
     @return {Integer} returns the y coordinate of the CollisionCircle
     */
    CollisionCircle.prototype.getY = function() {
        return this.y;
    };

    /**
     the getRadius method allow you to get the radius of the current CollisionCircle object.
     @method getRadius
     @return {Integer} returns the radius of the current CollisionCircle.
     */
    CollisionCircle.prototype.getRadius = function() {
        return this.radius;
    };

    /**
     the setRadius method allow you to set the radius of the current CollisionCircle object.
     @method setRadius
     @param {Integer} rad the radius of the current CollisionCircle
     */
    CollisionCircle.prototype.setRadius = function(rad) {
        this.radius = rad;
    };

    /**
     * the setDebug method allow you to set the debug mode of the current CollisionCircle object.
     * @method setDebug
     * @param {Boolean} debug the boolean value to determine if the current CollisionCircle object must
     *  switch into debug mode (true) or release mode (false)
     */
    CollisionCircle.prototype.setDebug = function(debug) {
        this.debug_mode = debug;
    };

    /**
     * the draw method allow you to draw the circle of the current CollisionCircle on the context only
     * if the current CollisionCircle object is in debug mode (that mean you must call `setDebug(true);`
     * before draw something on the context).
     *
     * @method draw
     * @param {CanvasRenderingContext2D} context the context to draw on.
     */
    CollisionCircle.prototype.draw = function(context) {
        if (context && this.debug_mode) {
            //Permet de sauvegarder le context
            context.save();
            //Set a l'identity la matrice de transformation
            context.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
            context.fillStyle = "rgb(" + 0 + ", " + 0 + ", " + 0 + ")";
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, Math.PI * 2.0, true);
            context.closePath();
            context.stroke();
            //Permet de restorer le context
            context.restore();
        }
    };

}(TW));

/**
 @module Math
 @namespace Math
 */
var TW = TW || {};

(function(TW) {

    TW.Math = TW.Math ||  {};
    TW.Math.Vector2D = Vector2D;

    if (typeof window.define === "function" && window.define.amd) {
        define('math/Vector2D',[], function() {
            return Vector2D;
        });
    }


    /**
     The Vector2D class allow you to create a vector2D object

     @class Vector2D
     @param {Number} x the x coordinate of the Vector2D
     @param {Number} y the y coordinate of the Vector2D
     @constructor
     */
    function Vector2D(x, y) {
        /**
         x coordinate
         @property {Number} x
         */
        this.x = x;
        /**
         y coordinate
         @property {Number} y
         */
        this.y = y;
    }

    /**
     * The add method allow you to add two vectors and return the sum of them.
     *
     * @method add
     * @param {Vector2D} vector the Vector2D to add with the current Vector2D object.
     * @return {Vector2D} return the sum of the two Vector2D
     */
    Vector2D.prototype.add = function(vector) {
        return new Vector2D(this.x + vector.x, this.y + vector.y);
    };

    /**
     * The sub method allow you to sub two vectors and return the subtraction of them.
     *
     * @method sub
     * @param {Vector2D} vector the Vector2D to subtract to the current Vector2D object.
     * @return {Vector2D} returns the subtraction of this and vector object.
     */
    Vector2D.prototype.sub = function(vector) {
        return new Vector2D(this.x - vector.x, this.y - vector.y);
    };

    /**
     The mult method allow you to mult the current Vector2D by a scalar and return the result.

     @method mult
     @param {float} scalar the scalar who multiply the current Vector2D
     @return {Vector2D} returns the current Vector2D multiplied by scalar.
     */
    Vector2D.prototype.mult = function(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    };

    /**
     The div method allow you to div the current Vector2D by a scalar and return the result

     @method div
     @param scalar
     @return {Vector2D} returns the current Vector2D divided by scalar
     */
    Vector2D.prototype.div = function(scalar) {
        return new Vector2D(this.x / scalar, this.y / scalar);
    };

    /**
     get the x coordinate of the current Vector2D

     @method getX
     @return {float} returns the x coordinate of the Vector2D
     @deprecated use directly Vector2D.x
     */
    Vector2D.prototype.getX = function() {
        return this.x;
    };

    /**
     get the y coordinate of the current Vector2D

     @method getY
     @return {float} returns the y coordinate of the Vector2D
     @deprecated use directly Vector2D.y
     */
    Vector2D.prototype.getY = function() {
        return this.y;
    };

    /**
     set the x coordinate of the current Vector2D

     @method setX
     @param {float} x the x coordinate of the Vector2D
     @deprecated use directly Vector2D.x
     */
    Vector2D.prototype.setX = function(x) {
        this.x = x;
    };

    /**
     set the y coordinate of the Vector2D
     @method setY
     @param {float} y the y coordinate of the Vector2D
     @deprecated use directly Vector2D.y
     */
    Vector2D.prototype.setY = function(y) {
        this.y = y;
    };

    /**
     normalize the current Vector2D

     @method normalize
     */
    Vector2D.prototype.normalize = function() {
        var length = Math.sqrt((this.x * this.x) + (this.y * this.y));
        this.x /= length;
        this.y /= length;
    };

    /**
     get the length of the Vector2D

     @method getLength
     @return {Number} returns the length of the Vector2D.
     */
    Vector2D.prototype.getLength = function() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    };

    /**
     set the length of the current Vector2D

     @method setLength
     @param {Number} length the length to apply to the current Vector2D
     */
    Vector2D.prototype.setLength = function(length) {
        this.normalize();
        this.x *= length;
        this.y *= length;
    };

    /**
     * get the angle of the current Vector2D
     *
     * @method getAngle
     * @return {Number} returns the angle of the current Vector2D (expressed in degree).
     */
    Vector2D.prototype.getAngle = function() {
        if (this.x === 0) {
            if (this.y > 0) {
                return 90;
            }
            if (this.y < 0) {
                return -90;
            }
            if (this.y === 0) {
                return 0;
            }
        }
	    var temp_x = this.x / this.getLength();
	    var temp_y = this.y / this.getLength();
	    return Math.atan(temp_y / temp_x) * 180.0 / Math.PI + ( temp_x < 0 ? 180 : 0);
    };


    /**
     set the angle of the current Vector2D

     @method setAngle
     @param {Number} angle the angle to apply to the current Vector2D (angle is expressed in degree)
     */
    Vector2D.prototype.setAngle = function(angle) {
        var length = this.getLength();
        this.x = Math.cos(angle / 180.0 * Math.PI) * length;
        this.y = Math.sin(angle / 180.0 * Math.PI) * length;
    };

    /**
     compute the dot product of the current Vector2D

     @method dotProduct
     @param {Vector2D} vector2 the second vector to compute the dot product
     @return {Number} returns the dot product between the current Vector2D and vector2.
     */
    Vector2D.prototype.dotProduct = function(vector2) {
        return ((this.x * vector2.x) + (this.y * vector2.y));
    };

    /**
     compute the angle between the current Vector2D and vector2

     @method getAngleBetween
     @param {Vector2D} vector2 the second vector to compute the angle between.
     @return {Number} returns the angle between the current Vector2D and vector2 (expressed in degree).
     */
    Vector2D.prototype.getAngleBetween = function(vector2) {
        var dot_prod = this.dotProduct(vector2);
        var length_v1 = this.getLength();
        var length_v2 = vector2.getLength();
        var cos = dot_prod / (length_v1 * length_v2);
        return Math.acos(cos) * 180.0 / Math.PI;
    };

    /**
     compute the cross product of the current Vector2D and vector2

     @method cross product
     @param {Vector2D} vector2 the second vector to use to compute the cross product
     @return {Number} returns the cross product between the current Vector2D and vector2
     */
    Vector2D.prototype.crossProduct = function(vector2) {
        return ((this.x * vector2.y) - (this.y * vector2.x));
    };

    /**
     * get the det of the current Vector2D and vector
     *
     * @method getDet
     * @param {Vector2D} vector the second Vector2D to use to compute the det of the two vectors
     * @return {Number} returns the det of the current Vector2D and vector,
     *  if the return value > 0 then vector is at left of this, if the return value is < 0 then vector is at right
     *  of this, if the return value is equal to 0 then vector is on this.
     */
    Vector2D.prototype.getDet = function(vector) {
        return this.crossProduct(vector);
    };

    /**
     popup the values of the Vector2D through an alert box.

     @method dump
     @deprecated use `window.alert(vector);` instead
     */
    Vector2D.prototype.dump = function() {
        window.alert(this);
    };

    /**
     give a data representation of Vector2D

     @method toString
     @return {String} data representation of Vector2D
     */
    Vector2D.prototype.toString = function() {
        return "[x=" + this.x + "; y=" + this.y + "]";
    };

}(TW));

/**
 @module Collision
 @namespace Collision
 */

var TW = TW || {};

(function(TW) {

    TW.Collision = TW.Collision ||  {};
    TW.Collision.CollisionSegment = CollisionSegment;

    if (typeof window.define === "function" && window.define.amd) {
        define('collision/CollisionSegment',['../math/Vector2D'], function() {
            return CollisionSegment;
        });
    }

    /**
     * The CollisionSegment class allow you to define a segment to test
     * collision width other segments and collision circles.
     *
     * @class CollisionSegment
     * @constructor
     * @param {Integer} x1 the x coordinate of the first point of the segment
     * @param {Integer} y1 the y coordinate of the first point of the segment
     * @param {Integer} x2 the x coordinate of the second point of the segment
     * @param {Integer} y2 the y coordinate of the second point of the segment
     */
    function CollisionSegment(x1, y1, x2, y2) {
        this.px = x1;
        this.py = y1;
        this.vector = new TW.Math.Vector2D(x2 - x1, y2 - y1);
    }

    /**
     The getVector method allow you to get the Vector of the collisionSegment
     @method getVector
     @return {Vector2D} returns the vector of the CollisionSegment.
     */
    CollisionSegment.prototype.getVector = function() {
        return this.vector;
    };

    /**
     The getPx method allow you to get the x coordinate of the first point of the CollisionSegment
     @method getPx
     @return {Integer} returns the x coordinate of the first point of the CollisionSegment
     */
    CollisionSegment.prototype.getPx = function() {
        return this.px;
    };

    /**
     The getPy method allow you to get the y coordinate of the first point of the CollisionSegment
     @method getPy
     @return {Integer} returns the y coordinate of the first point of the CollisionSegment
     */
    CollisionSegment.prototype.getPy = function() {
        return this.py;
    };

    /**
     * The isCollidingSegment method allow you to test if the current segment is colliding another segment.
     * @method isCollidingSegment
     * @param {CollisionSegment} segment the CollisionSegment to test
     * if is colliding the current collision segment object.
     * @return {boolean} return true if segment is colliding the current CollisionSegment.
     */
    CollisionSegment.prototype.isCollidingSegment = function(segment) {
        var ax = this.px;
        var ay = this.py;
        var cx = segment.getPx();
        var cy = segment.getPy();
        var vector_i = this.getVector();
        var vector_j = segment.getVector();
        var k;
        var m;
        var denominateur = (vector_i.getX() * vector_j.getY()) - (vector_i.getY() * vector_j.getX());

        if (denominateur === 0) {
            return false;
        }
        m = -((-vector_i.getX() * ay) + (vector_i.getX() * cy) + (vector_i.getY() * ax) - (vector_i.getY() * cx)) /
            denominateur;
        k = -((ax * vector_j.getY()) - (cx * vector_j.getY()) - (vector_j.getX() * ay) + (vector_j.getX() * cy)) /
            denominateur;
        return (0 <= m && m <= 1 && 0 <= k && k <= 1);
    };

    /**
     The isCollidingCircle method allow you to test the collision beetween the current object and the circle object
     @method isCollidingCircle
     @param {CollisionCircle} circle the CollisionCircle to test the interection with the CollisionSegment.
     @return {boolean} return true if circle is colliding the current CollisionSegment.
     */
    CollisionSegment.prototype.isCollidingCircle = function(circle) {
        var a_x = this.px;
        var a_y = this.py;
        var b_x = a_x + this.vector.getX();
        var b_y = a_y + this.vector.getY();
        var v_x = b_x - a_x;
        var v_y = b_y - a_y;
        var radius = circle.getRadius();
        var delta;

        a_x -= circle.getX();
        a_y -= circle.getY();
        delta = (((2 * a_x * v_x) + (2 * a_y * v_y)) * ((2 * a_x * v_x) + (2 * a_y * v_y))) -
            (4 * ((v_x * v_x) + (v_y * v_y)) * ((a_x * a_x) + (a_y * a_y) - (radius * radius)));
        if (delta >= 0) {
            if ((((2 * a_x * v_x + 2 * a_y * v_y) * -1) + (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) <
                1.0 &&
                (((2 * a_x * v_x + 2 * a_y * v_y) * -1) + (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) >
                    0.0) {
                return true;
            }
            if ((((2 * a_x * v_x + 2 * a_y * v_y) * -1) - (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) <
                1.0 &&
                (((2 * a_x * v_x + 2 * a_y * v_y) * -1) - (Math.sqrt(delta))) / (2 * ((v_x * v_x) + (v_y * v_y))) >
                    0.0) {
                return true;
            }
        }
        return false;
    };

}(TW));

/**
 * The aim of this module is to give you tools to test intersections between bounding boxes,
 * bouncing circles and segments.
 *
 * Three classes covers a large set of interaction for different shapes, and meet all standard requirements:
 * {{#crossLink "Collision.CollisionBox"}}{{/crossLink}} for Axis-aligned bounding box,
 * {{#crossLink "Collision.CollisionCircle"}}{{/crossLink}} for bounding circle and
 * {{#crossLink "Collision.CollisionSegment"}}{{/crossLink}} for all others possibilities.
 *
 * @module Collision
 * @main
 */


var TW = TW || {};

if (typeof window.define === "function" && window.define.amd) {

    define('collision',[
        './collision/CollisionBox',
        './collision/CollisionCircle',
        './collision/CollisionSegment'
    ], function() {
        return TW.Collision;
    });

}
;
/**
 @module Event
 @namespace Event
 */

var TW = TW || {};

(function(TW) {

    TW.Event = TW.Event ||  {};
    TW.Event.EventProvider = EventProvider;

    if (typeof window.define === "function" && window.define.amd) {
        define('event/EventProvider',[], function() {
            return EventProvider;
        });
    }

    /**
     * Abstract class representing an event provider.
     * The class contains a list of variables with a certain state.
     * When a variable change, all listeners are called.
     *
     * All inputs can be represented by a list of states (ex: mouse position, each key (pressed or released)).
     *
     * @class EventProvider
     * @constructor
     */
    function EventProvider() {
        /**
         * List of all event variables name.
         *
         * @property {String[]} states []
         * @protected
         */
        this.states = [];

        /**
         * List of values for state variables.
         * `this.states` and `this.values` share the same array index.
         *
         * @property {Array}    values
         * @protected
         */
        this.values = [];

        /**
         * List of previous values for state variables.
         * `this.states` and `this.oldValues` share the same array index.
         *
         * @property {Array}    oldValues
         * @protected
         */
        this.oldValues = [];

        this._globalCallbacks = [];
        this._stateCallbacks = [];

        /* used for giving a unique id */
        this.next_id = 1;
    }

    /**
     * return a const string representing the type of provider.
     * All providers of the same type must return the same result.
     *
     * **Note:** All child class MUST implement this method.
     *
     * @method getType
     * @return {String} name of Provider type.
     */
    EventProvider.prototype.getType = function() {
        return null;            //TODO MUST be implemented !!!
    };

    /**
     * List all variables accessible by this provider
     * Each variable can accept listeners.
     *
     * **Note:** return value is a reference. you should make a copy if you need to modify it.
     * @method getStateList
     * @return {String[]}   [] list of name variables.
     */
    EventProvider.prototype.getStateList = function() {
        return this.states;
    };

    /**
     *  Search the state of a state variable
     *
     * @method getState
     * @param {String}  name
     * @return {*}    value of corresponding variable
     */
    EventProvider.prototype.getState = function(name) {
        var i, len;

        for (i = 0, len = this.states.length; i < len; ++i) {
            if (this.states[i] === name) {
                return this.values[i];
            }
        }
        return null; //TODO: throw exception ?
    };

    /**
     *  Search the previous state of a state variable.
     *  The provider keep always one old state for each variable.
     *  It's useful for compare the difference.
     *
     * @method getOldState
     * @param {String}  name
     * @return {*}    value of corresponding variable
     */
    EventProvider.prototype.getOldState = function(name) {
        var i, len;

        for (i = 0, len = this.states.length; i < len; ++i) {
            if (this.states[i] === name) {
                return this.oldValues[i];
            }
        }
        return null; //TODO: throw exception ?
    };

    /**
     * add a listener.
     *
     * it can listen all events or only one event variable.
     * The listener can choose to be called for all events associated to a variable,
     * or only when the variable is in a certain state.
     *
     * @method addListener
     * @param {String}   [event]    name of event variable. y default, all events are caught.
     * @param {*}        [value]    value expected for call the callback. By default, any value call the callback.
     * @param {Function} callback   callback function called with 3 parameters:
     *      @param {String}         callback.event      event name
     *      @param {*}              callback.value      new value
     *      @param {EventProvider}  callback.provider   instance of provider
     * @return {Number} listener id (used for remove it
     * with {{#crossLink "Event.EventProvider/rmListener"}}{{/crossLink}})
     *
     * @example
     *
     *      //myCallback will be called for each events.
     *      provider.addListener(myCallback);
     *
     *      //mySecondCallback will be called only when the "A" variable obtain the state KEY_PRESSED.
     *      provider.addListener("A", provider.KEY_PRESSED, mySecondCallback);
     */
    EventProvider.prototype.addListener = function(event, value, callback) {
        var i, len, id;

        if (callback === undefined) {
            callback = value;
            value = undefined;
        }
        if (callback === undefined) {
            callback = event;
            event = undefined;
        }

        id = this.next_id;
        this.next_id++;

        if (event === undefined) {
            this._globalCallbacks.push({
                id:         id,
                callback:   callback
            });
            return id;
        } else {
            for (i = 0, len = this.states.length; i < len; ++i) {
                if (this.states[i] === event) {
                    if (this._stateCallbacks[i] === undefined) {
                        this._stateCallbacks[i] = [];
                    }
                    this._stateCallbacks[i].push({
                        id:         id,
                        filter:     value,
                        callback:   callback
                    });
                    return id;
                }
            }
            return null;    //TODO: throw exception ?
        }
    };

    /**
     * Remove a listener.
     *
     * @method rmListener
     * @param {Number} id id of the listener.
     */
    EventProvider.prototype.rmListener = function(id) {
        var i, j, len, len2;

        for (i = 0, len = this._globalCallbacks.length; i < len; ++i) {
            if (this._globalCallbacks[i].id === id) {
                this._globalCallbacks.splice(i, 1);
                return;
            }
        }

        for (i = 0, len = this._stateCallbacks.length; i < len; ++i) {
            if (this._stateCallbacks[i] !== undefined) {
                for (j = 0, len2 = this._stateCallbacks[i].length; j < len2; ++j) {
                    if (this._stateCallbacks[i][j].id === id) {
                        this._stateCallbacks[i].splice(j, 1);
                        return;
                    }
                }
            }
        }
    };

    /**
     * Apply a modification to an internal state variable
     * and call listeners.
     *
     * @method modifyState
     * @param {String}  event       event name
     * @param {*}       new_value   the new value.
     * @protected
     */
    EventProvider.prototype.modifyState = function(event, new_value) {
        var i, j, len, len2;

        for (i = 0, len = this.states.length; i < len; ++i) {
            if (this.states[i] === event) {
                this.oldValues[i] = this.values[i];
                this.values[i] = new_value;

                for (j = 0, len2 = this._globalCallbacks.length; j < len2; ++j) {
                    this._globalCallbacks[j].callback(event, new_value, this);
                }
                if (this._stateCallbacks[i] !== undefined) {
                    for (j = 0, len2 = this._stateCallbacks[i].length; j < len2; ++j) {
                        if (this._stateCallbacks[i][j].filter === undefined ||
                            new_value === this._stateCallbacks[i][j].filter) {
                            this._stateCallbacks[i][j].callback(event, new_value, this);
                        }
                    }
                }
            }
        }
	};

    /**
     * Apply a modification to an internal state variable
     * and call listeners.
     *
     * @method modifyState
     * @param {String}  event       event name
     * @param {*}       new_value   the new value.
     * @protected
     */
    EventProvider.prototype.modifyState = function(event, new_value) {
        var i, j, len, len2;

        for (i = 0, len = this.states.length; i < len; ++i) {
            if (this.states[i] === event) {
                this.oldValues[i] = this.values[i];
                this.values[i] = new_value;

                for (j = 0, len2 = this._globalCallbacks.length; j < len2; ++j) {
                    this._globalCallbacks[j].callback(event, new_value, this);
                }
                if (this._stateCallbacks[i] !== undefined) {
                    for (j = 0, len2 = this._stateCallbacks[i].length; j < len2; ++j) {
                        if (this._stateCallbacks[i][j].filter === undefined ||
                            JSON.stringify(new_value) === JSON.stringify(this._stateCallbacks[i][j].filter)) {
                            this._stateCallbacks[i][j].callback(event, new_value, this);
                        }
                    }
                }
            }
        }
        // TODO: throw exception ?
    };

}(TW));

/**
 @module Utils
 @namespace Utils
 */

var TW = TW || {};

(function(TW) {

    TW.Utils = TW.Utils ||  {};

    if (typeof window.define === "function" && window.define.amd) {
        define('utils/Inheritance',[], function() {
            return TW.Utils;
        });
    }

    /**
     * Provide an useful way to use inheritance
     *
     * @param child
     * @param parent
     * @class inherit
     */
    TW.Utils.inherit  = function(child, parent) {

        function Foo() {}
		var tmp = {};

        Foo.prototype = parent.prototype;
		TW.Utils.copyParam(tmp, {}, child.prototype);
        child.prototype = new Foo();
		TW.Utils.copyParam(child.prototype, {}, tmp);
    };

	/**
	 * Copy an object and all its members recursively. Numbers and others non-objects values
	 * are simply copied.
	 *
	 * Inherited members are also copied.
	 *
	 * *Warning:* if your object contains several references to the same object,
	 * this object will be copied several times.<br />
	 * In case of crossed references, this method will never terminate.
	 *
	 * @mathod clone
	 * @param {*} src_instance
	 * @returns {*} copy of src_instance.
	 */
    TW.Utils.clone = function(src_instance) {
        if(typeof(src_instance) !== 'object' || src_instance === null) {
            return src_instance;
        }
        var new_instance = new src_instance.constructor();

	    /* jshint forin: false */
	    for(var i in src_instance)
        {
	        new_instance[i] = TW.Utils.clone(src_instance[i]);
        }
        return new_instance;
    };

	/**
	 * copy all allowed variables from `params` to `target`, using `defaultContext` for set default values.
	 *
	 * `copyParam` is used principally for easily copy parameters from hash objects.
	 * All variables must be present in `defaultContext`,
	 * so adding an unespected variable will not override `target` object.
	 * All values in `defayultContext` are also copied as default values.
	 *
	 * If you want to allow some properties, but not to set default value,
	 * you can create the property and set it to undefined.
	 *
	 * @examples:
	 *
	 *      var target = {};
	 *      var default_context = {
	 *          foo:    "default value",
	 *          bar:    33,
	 *          baz:    undefined           // baz is allowed, but has not default value.
	 *      };
	 *
	 *      Utils.copyParam(target, { foo: "some value", unknown: 3 }, default_context);
	 *      console.log(target);
	 *      // Object {foo: "some value", bar: 33}
	 *      //unknown is not copied because not allowed.
	 *
	 * @method copyParam
	 *
	 *
	 * @param {Object} target
	 * @param {Object} params
	 * @param {Object} default_context
	 */
	TW.Utils.copyParam = function(target, params, default_context) {
		for (var i in default_context) {
			if (default_context.hasOwnProperty(i)) {
				if (params !== undefined && typeof params.hasOwnProperty === "function" &&
				    params.hasOwnProperty(i)) {
					target[i] = params[i];
				} else if (default_context[i] !== undefined) {
					target[i] = default_context[i];
				}
			}
		}
	};


}(TW));


/**
 @module Event
 @namespace Event
 */

var TW = TW || {};

(function(TW) {

    TW.Event = TW.Event ||  {};
    TW.Event.KeyboardInput = KeyboardInput;

    if (typeof window.define === "function" && window.define.amd) {
        define('event/KeyboardInput',['./EventProvider', '../utils/Inheritance'], function() {
            TW.Utils.inherit(KeyboardInput, TW.Event.EventProvider);
            return KeyboardInput;
        });
    } else {
        TW.Utils.inherit(KeyboardInput, TW.Event.EventProvider);
    }

    /**
     * EventProvider using the keyboard.
     *
     *
     * Each event represent a key. each key has two states: `KEY_PRESSED` or `KEY_RELEASED`
     *
     *
     * ## List of keys:
     *
     * - KEY_A
     * - KEY_B
     * - KEY_C
     * - KEY_D
     * - KEY_E
     * - KEY_F
     * - KEY_G
     * - KEY_H
     * - KEY_I
     * - KEY_J
     * - KEY_K
     * - KEY_L
     * - KEY_M
     * - KEY_N
     * - KEY_O
     * - KEY_P
     * - KEY_Q
     * - KEY_R
     * - KEY_S
     * - KEY_T
     * - KEY_U
     * - KEY_V
     * - KEY_W
     * - KEY_X
     * - KEY_Y
     * - KEY_Z
     * - KEY_0
     * - KEY_1
     * - KEY_2
     * - KEY_3
     * - KEY_4
     * - KEY_5
     * - KEY_6
     * - KEY_7
     * - KEY_8
     * - KEY_9
     * - KEY_F1
     * - KEY_F2
     * - KEY_F3
     * - KEY_F4
     * - KEY_F5
     * - KEY_F6
     * - KEY_F7
     * - KEY_F8
     * - KEY_F9
     * - KEY_F10
     * - KEY_F11
     * - KEY_F12
     * - KEY_BACKSPACE
     * - KEY_TAB
     * - KEY_ENTER
     * - KEY_SHIFT
     * - KEY_ALT
     * - KEY_PAUSE
     * - KEY_CAPSLOCK
     * - KEY_ESC
     * - KEY_SPACE
     * - KEY_PAGE_UP
     * - KEY_PAGE_DOWN
     * - KEY_END
     * - KEY_HOME
     * - KEY_LEFT
     * - KEY_UP
     * - KEY_RIGHT
     * - KEY_DOWN
     * - KEY_INSERT
     * - KEY_DELETE
     * - KEY_NUMLOCK
     *
     *
     * <span>
     * __Note:__
     * This class use the `keyCode` attribute from KeyboardEvent object.
     * The code list of [current W3C standard](http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html)
     * is not implemented and there is differences between each browser.<br />
     * The [next W3C standard](http://www.w3.org/TR/DOM-Level-3-Events/#keys-keyvalues)
     * should improve compatibility.<br />
     * __Currently, using Numeric key (from Keypad or not) with the Shift,
     * CapsLock or NumLock keys is not possible.__<br />
     * __Use exotic keys are strongly discouraged.__<br />
     * <br />
     * For example, using Chrome 22.0.1229.94 (under Linux) with a fr keyboard, key `&` (key `1` without `Shift`)
     * are equally to key `7`.
     * For more information about compatibility,[this document](http://unixpapa.com/js/key.html) provide
     * a good summary of the situation.
     *
     * Usage of arrows keys, and usage of controls keys with alphabetic characters are supported.
     *
     *
     *
     * @example
     *
     *      var keyboard = new KeyboardInput();
     *      keyboard.addListener("KEY_SPACE", KeyboardInput.KEY_PRESSED, function(event, value, provider) {
     *          if (provider.getState("KEY_CTRL") === KeyboardInput.KEY_PRESSED) {
     *              //CTRL+space is pressed !
     *          }
     *      });
     *
     * @class KeyboardInput
     * @extends Event.EventProvider
     * @param {HTMLElement} [target]      element to listen keypressed and keyup. default to `window.document`
     * @constructor
     */
    function KeyboardInput(target) {
        var i, len;

        TW.Event.EventProvider.call(this);


        if (target === undefined) {
            target = window.document;
        }

        this.states = [];

        //from KEY_A to KEY_Z
        for (i = 0; i < 26; i++) {
            this.states.push('KEY_' + String.fromCharCode('A'.charCodeAt(0) + i));      // charCode MAJ
        }
        //from KEY_F1 to KEY_F12
        for (i = 0; i < 12; i++) {
            this.states.push('KEY_F' + String.fromCharCode('1'.charCodeAt(0) + i)); //      112
        }
        // KEY_0 to KEY_9
        for (i = 0; i < 10; i++) {
            this.states.push('KEY_' + String.fromCharCode('0'.charCodeAt(0) + i));  //      48
        }

        this.states.push('KEY_BACKSPACE', 8);
        this.states.push('KEY_TAB', 9);
        this.states.push('KEY_ENTER', 13);
        this.states.push('KEY_SHIFT', 16);
        this.states.push('KEY_CTRL', 17);
        this.states.push('KEY_ALT', 18);
        this.states.push('KEY_PAUSE', 19);
        this.states.push('KEY_CAPSLOCK', 20);
        this.states.push('KEY_ESC', 27);
        this.states.push('KEY_SPACE', 32);
        this.states.push('KEY_PAGE_UP', 33);
        this.states.push('KEY_PAGE_DOWN', 34);
        this.states.push('KEY_END', 35);
        this.states.push('KEY_HOME', 36);
        this.states.push('KEY_LEFT', 37);
        this.states.push('KEY_UP', 38);
        this.states.push('KEY_RIGHT', 39);
        this.states.push('KEY_DOWN', 40);
        this.states.push('KEY_INSERT', 45);
        this.states.push('KEY_DELETE', 46);
        this.states.push('KEY_NUMLOCK', 144);

        for (i = 0, len = this.states.length; i < len; i++) {
            this.values[i] = KeyboardInput.KEY_RELEASED;
            this.oldValues[i] = KeyboardInput.KEY_RELEASED;
        }

        target.addEventListener("keydown", this._onKeyDown.bind(this), false);
        target.addEventListener("keyup", this._onKeyUp.bind(this), false);
    }

    /**
     * Represent a key pressed state
     * @property {Boolean} KEY_PRESSED
     * @static
     * @readonly
     */
    KeyboardInput.KEY_PRESSED = true;

    /**
     *Represent a key released state
     * @property {Boolean} KEY_RELEASED
     * @static
     * @readonly
     */
    KeyboardInput.KEY_RELEASED = false;


    /**
     * return the EventProvider type.
     *
     * @method getType
     * @return {String}     "KEYBOARD"
     */
    KeyboardInput.prototype.getType = function() {
        return "KEYBOARD";
    };

    /**
     * Called when a key is pressed.
     *
     * @method _onKeyDown
     * @param {KeyboardEvent}  event
     * @private
     */
    KeyboardInput.prototype._onKeyDown = function(event) {
        this.modifyState(this._getAssociatedEvent(event), KeyboardInput.KEY_PRESSED);
    };

    /**
     * Called when a key is released.
     *
     * @method _onKeyUp
     * @param {KeyboardEvent}  event
     * @private
     */
    KeyboardInput.prototype._onKeyUp = function(event) {
        this.modifyState(this._getAssociatedEvent(event), KeyboardInput.KEY_RELEASED);
    };

    /**
     * search a state corresponding to the event object
     *
     * @method _getAssociatedEvent
     * @param {KeyboardEvent}   event
     * @return {String|null}    name of state changed. null if no state is found.
     * @private
     */
    KeyboardInput.prototype._getAssociatedEvent = function(event) {
        if (event.keyCode >= 'A'.charCodeAt(0) && event.keyCode <= 'Z'.charCodeAt(0)) {
            return 'KEY_' + String.fromCharCode(event.keyCode);
        }

        if (event.keyCode >= '0'.charCodeAt(0) && event.keyCode <= '9'.charCodeAt(0)) {
            return 'KEY_' + String.fromCharCode(event.keyCode);
        }

        if (event.keyCode >= 112 && event.keyCode < 124) {
            return 'KEY_F' + String.fromCharCode(111 - event.keyCode);
        }

        switch (event.keyCode) {
            case 8:
                return 'KEY_BACKSPACE';
            case 9:
                return 'KEY_TAB';
            case 13:
                return 'KEY_ENTER';
            case 16:
                return 'KEY_SHIFT';
            case 17:
                return 'KEY_CTRL';
            case 18:
                return 'KEY_ALT';
            case 19:
                return 'KEY_PAUSE';
            case 20:
                return 'KEY_CAPSLOCK';
            case 27:
                return 'KEY_ESC';
            case 32:
                return 'KEY_SPACE';
            case 33:
                return 'KEY_PAGE_UP';
            case 34:
                return 'KEY_PAGE_DOWN';
            case 36:
                return 'KEY_HOME';
            case 37:
                return 'KEY_LEFT';
            case 38:
                return 'KEY_UP';
            case 39:
                return 'KEY_RIGHT';
            case 40:
                return 'KEY_DOWN';
            case 45:
                return 'KEY_INSERT';
            case 46:
                return 'KEY_DELETE';
            case 144:
                return 'KEY_NUMLOCK';
            default:
                return null;
        }
    };

}(TW));

/**
 @module Event
 @namespace Event
 */

var TW = TW || {};

(function(TW) {

    TW.Event = TW.Event ||  {};
    TW.Event.MouseInput = MouseInput;

    if (typeof window.define === "function" && window.define.amd) {
		define('event/MouseInput',['./EventProvider', '../utils/Inheritance'], function() {
            TW.Utils.inherit(MouseInput, TW.Event.EventProvider);
            return MouseInput;
        });
	} else {
        TW.Utils.inherit(MouseInput, TW.Event.EventProvider);
    }

    /**
     * EventProvider using the mouse.
     *
     * Four events are provided:
     *
     *  - `MOUSE_MOVE` (object containing `x` and `y` properties)
     *  - `MOUSE_BUTTON_LEFT` (type boolean)
     *  - `MOUSE_BUTTON_RIGHT` (type boolean)
     *  - `MOUSE_BUTTON_MIDDLE` (type boolean)
     *
     * Each button is either `MOUSE_PRESSED` or `MOUSE_RELEASED` following the mouse state.<br />
     * The `MOUSE_MOVE` state contain directly and object representing the position of the object.
     * At each mouse movement, a new event is created, updating the values.
     *
     *
     * @example
     *
     *      var mouse = new MouseInput();
     *      mouse.addListener("MOUSE_BUTTON_LEFT", MouseInput.BUTTON_PRESSED, function(event, value, provider) {
     *      });
     *
     *
     * @class MouseInput
     * @extends EventProvider
     * @param {HTMLElement} [target] element listened. Only mouse events on target are considered.
     *   default to window.document.
     * @constructor
     */

    function MouseInput(target) {
        var i, len;

        TW.Event.EventProvider.call(this);


        if (target === undefined) {
            target = window.document;
        }

        /**
         * Enable or disable context menu display on right click.
         *
         * @property {Boolean} contextMenuActive
         * @default true
         */
        this.contextMenuActive = true;

        this.states.push('MOUSE_MOVE');
        this.states.push('MOUSE_BUTTON_LEFT');
        this.states.push('MOUSE_BUTTON_MIDDLE');
        this.states.push('MOUSE_BUTTON_RIGHT');

        for (i = 0, len = this.states.length; i < len; i++) {
            if (this.states[i] === 'MOUSE_MOVE') {
                this.values[i] = {x: undefined, y: undefined};
                this.oldValues[i] = {x: undefined, y: undefined};
            } else {
                this.values[i] = MouseInput.BUTTON_RELEASED;
                this.oldValues[i] = MouseInput.BUTTON_RELEASED;
            }
        }

        target.addEventListener("mousemove", this._onMouseMove.bind(this), false);
        target.addEventListener("mouseup", this._onMouseUp.bind(this), false);
        target.addEventListener("mousedown", this._onMouseDown.bind(this), false);
        target.addEventListener("contextmenu",  this._showContextMenu.bind(this), false);
    }

    /**
     * Represent a button pressed state
     * @property {Boolean} BUTTON_PRESSED
     * @static
     * @readonly
     */
    MouseInput.BUTTON_PRESSED = true;

    /**
     *Represent a button released state
     * @property {Boolean} BUTTON_RELEASED
     * @static
     * @readonly
     */
    MouseInput.BUTTON_RELEASED = false;


    /**
     * return the EventProvider type.
     *
     * @method getType
     * @return {String}     "MOUSE"
     */
    MouseInput.prototype.getType = function() {
        return "MOUSE";
    };

    /**
     * Called when a mouse is moved.
     *
     * @method _onMouseMove
     * @param {MouseEvent}  event
     * @private
     */
    MouseInput.prototype._onMouseMove = function(event) {
        this.modifyState('MOUSE_MOVE', {
            x: event.clientX - event.target.getBoundingClientRect().left,
            y: event.clientY - event.target.getBoundingClientRect().top
        });
    };

    /**
     * Called when a mouse button is released.
     *
     * @method _onMouseUp
     * @param {MouseEvent}  event
     * @private
     */
    MouseInput.prototype._onMouseUp = function(event) {
        this.modifyState(this._getAssociatedEvent(event), MouseInput.BUTTON_RELEASED);
    };

    /**
     * Called when a mouse button is pressed.
     *
     * @method _onMouseDown
     * @param {MouseEvent}  event
     * @private
     */
    MouseInput.prototype._onMouseDown = function(event) {
        this.modifyState(this._getAssociatedEvent(event), MouseInput.BUTTON_PRESSED);
    };

    /**
     * search a state corresponding to the event object
     *
     * @method _getAssociatedEvent
     * @param {MouseEvent}   event
     * @return {String|null}    name of state changed. null if no state is found.
     * @private
     */
    MouseInput.prototype._getAssociatedEvent = function(event) {

        switch (event.button) {
            case 0:
                return 'MOUSE_BUTTON_LEFT';
            case 1:
                return 'MOUSE_BUTTON_MIDDLE';
            case 2:
                return 'MOUSE_BUTTON_RIGHT';
            default:
                return null;
        }
    };

    /**
     * remove showing of context menu
     *
     * @method _showContextMenu
     * @param {MouseEvent}   event
     * @private
     */
    MouseInput.prototype._showContextMenu = function(event) {

        if (this.contextMenuActive === false) {
            event.preventDefault();
        }
    };

}(TW));

/**
 @module Event
 @namespace Event
 */

var TW = TW || {};

(function(TW) {

    TW.Event = TW.Event ||  {};
    TW.Event.InputMapper = InputMapper;

	if (typeof window.define === "function" && window.define.amd) {
		define('event/InputMapper',['./EventProvider', '../utils/Inheritance'], function() {
            TW.Utils.inherit(InputMapper, TW.Event.EventProvider);
            return InputMapper;
        });
	} else {
        TW.Utils.inherit(InputMapper, TW.Event.EventProvider);
    }

    /**
     * InputMapper is a virtual event provider used to redirect event under an other event.
     *
     * It allow to create custom events (user-defined), following others eventProviders.
     * Its role is to act as an interface, hiding real event which can be changed without the user noticing.
     *
     * A typical utilisation is the remapping is to let the choice of controls keyboard to the player.
     *
     * @example
     *
     *      var keyboardEvents = new KeyboardInput();
     *      var inputMapper = new InputMapper();
     *
     *      inputMapper.addEvent("ATTACK");
     *      inputMapper.bind("ATTACK", "KEY_Q", keyboardEvents);
     *
     *      inputMapper.addListener("ATTACK", KeyboardInput.KEY_PRESSED, function(event, value, provider) {
     *      });
     *
     * @class InputMapper
     * @constructor
     */
    function InputMapper() {

        TW.Event.EventProvider.call(this);

        this.enable = true;

        this._binds = [];
    }

    /**
     * return the EventProvider type.
     *
     * @method getType
     * @return {String}     "MAPPER"
     */
    InputMapper.prototype.getType = function() {
        return "MAPPER";
    };


    /**
     * Getting the name of event bind with localEvent.
     *
     * @method getRealEvent
     * @param {String}  localEvent
     * @return {String} Name of the real event if it exist or null
     */
    InputMapper.prototype.getRealEvent = function(localEvent) {
        var i;
        i = this.states.indexOf(localEvent);

        if (i === -1) {
            return null;
        }

        return this._binds[i] ? this._binds[i].event : null;
    };


    /**
     * Getting a array of all no mapped local event.
     *
     * @method getNoMappedEvents
     * @return {Array} Array with all local events who is not already bound
     */
    InputMapper.prototype.getNoMappedEvents = function() {
        var i, len, arr;

        arr = [];
        for (i = 0, len = this._binds.length; i < len; ++i) {
            if (this._binds[i] === undefined) {
                arr.push(this.states[i]);
            }
        }
        return arr;
    };

    /**
     * Adding a local event.
     *
     * @method addEvent
     * @param {String}  name
     * @return {Boolean} true if success, false if failure
     */
    InputMapper.prototype.addEvent = function(name) {
        if (this.states.indexOf(name) !== -1) {
            return false;
        }

        this.states.push(name);
        this._binds.push(undefined);
        this.values.push(undefined);
        this.oldValues.push(undefined);

        return true;
    };

    /**
     * Removing a local event.
     *
     * @method rmEvent
     * @param {String}  name
     * @return {Boolean} true if success, false if failure
     */
    InputMapper.prototype.rmEvent = function(name) {
        var i;
        i = this.states.indexOf(name);

        if (i === -1) {
            return false;
        }
        this.states.splice(i, 1);
        this._binds.splice(i, 1);
        this.values.splice(i, 1);
        this.oldValues.splice(i, 1);

        return true;
    };

    /**
     * Bind a remote event to a local event.
     *
     * @method bindEvent
     * @param {String}  localEvent
     * @param {String}  remoteEvent
     * @param {EventProvider}  input
     */
    InputMapper.prototype.bindEvent = function(localEvent, remoteEvent, input) {
        var i, id;
        i = this.states.indexOf(localEvent);

        if (i === -1 || input.getStateList().indexOf(remoteEvent) === -1) {
            return false;
        }

        if ( this._binds[i] !== undefined ) {
            this._binds[i].input.rmListener(this._binds[i].id);
        }

        id = input.addListener(remoteEvent, this._bindEvent.bind(this));
        this._binds[i] = {event: remoteEvent, input: input, id: id};
        return true;
    };


    /**
     * Bind a remote event to a local event by listening to the next event of input.
     *
     * @method bindListen
     * @param {String}  localEvent
     * @param {EventProvider}  input
     */
    InputMapper.prototype.bindListen = function(localEvent, input, callback) {
        var i, id;
        i = this.states.indexOf(localEvent);

        if (i === -1) {
            return false;
        }

        if ( this._binds[i] !== undefined ) {
            this._binds[i].input.rmListener(this._binds[i].id);
        }

        this.stopBindListen();

        id = input.addListener(this._bindListenEvent.bind(this));
        this._binds[i] = {event: undefined, input: input, id: id, callback: callback};
        return true;
    };


    /**
     * Stop a listening of the function bindListen.
     *
     * @method stopBindListen
     */
    InputMapper.prototype.stopBindListen = function() {
        var i, len;

        for (i = 0, len = this._binds.length; i < len; ++i) {
            if (this._binds[i] !== undefined && this._binds[i].event === undefined) {
                this._binds[i].input.rmListener(this._binds[i].id);
                this._binds.splice(i, 1);
                return;
            }
        }
    };

    /**
     * Callback function who bind a local event with remote event.
     *
     * @method _bindEvent
     * @param {String}   event
     * @param {Boolean|Object}   new_value
     * @param {EventProvider}   object
     * @private
     */
    InputMapper.prototype._bindEvent = function(event, new_value, object) {
        var i, len;
        if (this.enable) {
            for (i = 0, len = this._binds.length; i < len; ++i) {
                if (this._binds[i] !== undefined && this._binds[i].event === event &&
                    this._binds[i].input === object) {
                    this.modifyState(this.states[i], new_value);
                }
            }
        }
    };

    /**
     * Callback function who bind a local event with remote event when bindListen is run.
     *
     * @method _bindListenEvent
     * @param {String}   event
     * @param {Boolean|Object}   new_value
     * @param {EventProvider}   object
     * @private
     */
    InputMapper.prototype._bindListenEvent = function(event, new_value, object) {
        var i, len;
        for (i = 0, len = this._binds.length; i < len; ++i) {
            if (this._binds[i] !== undefined && this._binds[i].event === undefined &&
                this._binds[i].input === object) {

                this._binds[i].input.rmListener(this._binds[i].id);
                if (this._binds[i].callback !== undefined) {
                    this._binds[i].callback(event);
                }
                this.bindEvent(this.states[i], event, object);
            }
        }
    };

}(TW));

/**
 * The event module provide all tools for catching input events, manipulate them and generate custom events.
 *
 * All events represent a state changeling from an {{#crossLink "Event.EventProvider"}}{{/crossLink}}.<br />
 * Because an event is not useful without data, each event provider has a number of custom states,
 * defined in the documentation.
 *
 * Each time a state change, an event is detected and all callbacks listening this event are called.
 * Because all classes have a common format, it's possible to easy combine and manipulate many providers.
 *
 * ## Input provider
 *
 * Two eventProviders are defined, giving access to the two most used input:
 * {{#crossLink "Event.KeyboardInput"}}{{/crossLink}} and {{#crossLink "Event.MouseInput"}}{{/crossLink}}.<br />
 * States available are mouse position, main mouse buttons, and all standard keyboard keys.
 *
 * ## Manipulate events
 *
 * The {{#crossLink "Event.InputMapper"}}{{/crossLink}} class provide an easy way to hide real used event,
 * allowing you to easily change an event (like specific keyboard key) for an action given.
 *
 * @module Event
 * @main
 */

 var TW = TW || {};

if (typeof window.define === "function" && window.define.amd) {

    define('event',[
        './event/EventProvider',
        './event/KeyboardInput',
        './event/MouseInput',
        './event/InputMapper'
    ], function() {
        return TW.Event;
    });

}
;
/**
 * @module Gameloop
 * @namespace Gameloop
 */


var TW = TW || {};

(function(TW) {

    TW.Gameloop = TW.Gameloop ||  {};
    TW.Gameloop.Gameloop = Gameloop;

    if (typeof window.define === "function" && window.define.amd) {
        define('gameloop/Gameloop',[], function() {
            return Gameloop;
        });
    }

    var anim_frame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        null;
    var cancel_anim_frame = window.cancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.oCancelAnimationFrame ||
        window.msCancelAnimationFrame ||
        null;

    /**
     * A class to manage the game logic and time.
     * Provide the simplest way to use a regular loop, splitting draw and update.
     * All elements added in `object` are updated or draw when te loop is started.
     *
     * @class Gameloop
     *
     * @constructor
     */
    function Gameloop() {
        this._last_id = 0;
        this._update_handler = null;
        this._draw_handler = null;
	    this._start_date = new Date();
	    this._fps_object = {
		    fps_amount: 0,
		    date_repository: new Date(),
		    counter: 0
	    };
	    this._time_last_update = new Date().getTime();
		this._tps_object = {
			tps_amount: 0,
			date_repository: new Date(),
			counter: 0
		};
	    this.object_to_suppress = [];
        /**
         The value that limits the maximum number of frames per second.
         Used only if requestAnimationFrame is not found
         .       Note: changes are effective only when gameloop is restarted.

         @property {Integer} fps
         @default 30
         */
        this.fps = 30;

        /**
         The frequency of function calls update
         Note: changes are effective only when gameloop is restarted.

         @property {Integer} tick_per_second
         @default 60
         */
        this.tick_per_second = 60;


        /**
         * array which contains all games elements.
         * You must add elements to `object` for updating
         * and drawing these elements.
         *
         * If an element is a function, it's called during update phase.
         * If it's an object, its draw function will be called during draw phase,
         * an its update function during update phase.
         * If a function does not exist, the gameloop will ignore it. update and draw functions are not mandatory.
         *
         * @property {Array} object
         */
        this.object = [];
    }

	    /**
	     * This function allows you to get a Date object which represents the instant when you called
	     * the start method of the gameloop.
	     *
	     * @method getStartDate
	     * @return {Date} if the gameloop has already been started this function returns an object which represent
	     * the start of the gameloop otherwise this method returns null.
	     */
	Gameloop.prototype.getStartDate = function() {
		return this._start_date;
	};

	    /**
	     * this method returns the average fps off ten seconds.
	     * @method getRealFPS
	     * @return {Number} returns the average fps off ten seconds.
	     */
	Gameloop.prototype.getRealFPS = function() {
		return this._fps_object.fps_amount;
	};

	    /**
	     * This method returns the average of TPS (average of update calls) in ten seconds.
	     * @method getRealTPS
	     * @return {Number} returns the average of tps in ten seconds.
	     */
	Gameloop.prototype.getRealTPS = function() {
		return this._tps_object.tps_amount;
	};

	    /**
	     * This method allows you to add an object to the Gameloop.
	     * when the gameloop is refreshing itself it tries to call the update and draw function of each object which
	     * are in its list. You can add any kind of object. you should add draw and update method to these objects
	     * because the gameloop will call them each cycle.
	     * @param {Object} object it is an object which will be added to the Gameloop's internal list.
	     * @return {Boolean} returns true on success otherwise returns false.
	     */
	Gameloop.prototype.addObject = function(object) {
		this.object.push(object);
	};

	    /**
	     * This method allows you to remove an object from the Gameloop's list.
	     * @param {Object} object a reference to the object that you want to suppress from the Gameloop's list.
	     * @return {Boolean} return true on success (the object have successfully been removed)
	     * otherwise it returns false.
	     */
	Gameloop.prototype.rmObject = function(object) {
		this.object_to_suppress.push(object);
	};

    /**
     start or unpause the gameloop.
     If gameloop is already stated, do nothing.

     @method start
     */
    Gameloop.prototype.start = function() {
        if (this._update_handler === null) {
            this._update_handler = setInterval(this.update.bind(this),
                1000 / this.tick_per_second);
        }
        if (this._draw_handler === null) {
            if (anim_frame !== null) {
                this._draw_handler = anim_frame(this.draw.bind(this));
            } else {
                //Compatibility mode
                this._draw_handler = setInterval(this.draw.bind(this), 1000 / this.fps);
            }
        } /* else {
            Console.log("Gameloop already started");
        } */
    };

    /**
     stop the update Gameloop
     Elements are still drawn, but not updated.
     You can resume the game with start

     @method pause
     */
    Gameloop.prototype.pause = function() {
        if (this._update_handler !== null) {
            clearInterval(this._update_handler);
            this._update_handler = null;
        }
    };

    /**
     stop the gameloop
     Both update and draw are stopped.
     The elements are not removed, so you can use start to resume play.
     If you need to keep the screen displayed, you should instead use pause.

     @method stop
     */
    Gameloop.prototype.stop = function() {
        this.pause();
        if (this._draw_handler !== null) {
            if (anim_frame !== null && cancel_anim_frame !== null) {
                cancel_anim_frame(this._draw_handler);
            } else {
                clearInterval(this._draw_handler);
            }
            this._draw_handler = null;
        }
    };


    /**
     update the logic one step.
     called automatically each step by start.

     @method update
     */
    Gameloop.prototype.update = function() {
        var current_date = new Date();
        var nb_to_suppress = this.object_to_suppress.length;
        for (var indexObjectToSuppress = 0; indexObjectToSuppress < nb_to_suppress; indexObjectToSuppress++) {
            for (var indexObject = 0; indexObject < this.object.length; indexObject++) {
                if (this.object_to_suppress[indexObjectToSuppress] === this.object[indexObject]) {
                    this.object.splice(indexObject, 1);
                    indexObject--;
                }
            }
        }
        this.object_to_suppress = [];

        for (var i = 0; i < this.object.length; i++) {
            if (typeof this.object[i] === "function") {
                this.object[i](current_date.getTime() - this._time_last_update);
            }
            if (typeof this.object[i] === "object") {
                if (typeof this.object[i].update !== "undefined") {
                    this.object[i].update(current_date.getTime() - this._time_last_update);
                }
            }
        }
	    this._tps_object.counter++;
	    var time;
	    time = current_date.getTime();
	    if (time - this._tps_object.date_repository.getTime() >= 1000) {
		    this._tps_object.date_repository = new Date();
		    this._tps_object.tps_amount = this._tps_object.counter;
		    this._tps_object.counter = 0;
	    }
	    this._time_last_update = current_date.getTime();
    };

    /**
     draw the content of gameloop.
     called automatically at the beginning of each step.

     @method draw
     */
    Gameloop.prototype.draw = function() {
        var i;
        for (i = 0; i < this.object.length; i++) {
            if (typeof this.object[i] === "object" &&
                typeof this.object[i].draw !== "undefined") {
                this.object[i].draw();
            }
        }
        if (anim_frame !== null) {
            this._draw_handler = anim_frame(this.draw.bind(this));
        }
	    this._fps_object.counter++;
	    var time;
	    time = new Date().getTime();
	    if (time - this._fps_object.date_repository.getTime() >= 1000) {
		    this._fps_object.date_repository = new Date();
		    this._fps_object.fps_amount = this._fps_object.counter;
		    this._fps_object.counter = 0;
	    }
    };

}(TW));

/**
 @module Gameloop
 @namespace Gameloop
 */

var TW = TW || {};

(function(TW) {

	TW.Gameloop = TW.Gameloop ||  {};
	TW.Gameloop.GameState = GameState;

	if (typeof window.define === "function" && window.define.amd) {
		define('gameloop/GameState',['./Gameloop', '../utils/Inheritance'], function() {
			return GameState;
		});
	}

	/**
	 * The GameState class provides an object which handle severals methods which can be called by the GameStateStack.
	 * Each GameState object contains some methods :
	 *
	 * - onUpdate       this method is called when the GameState is updating.
	 * - onDraw         this method is called when the GameState is drawing
	 * - onCreation     this method is called when the GameState is added to a GameStateStack
	 * - onDelete       this method is called when the GameState is removed from a GameStateStack
	 * - onSleep        this method is called when the GameState looses the focus.
	 * - onWakeUp       this method is called when the GameState takes back the focus.
	 *
	 * The main aim of these methods is to be overrided by your own methods.
	 * For example, if you want to override the onUpdate and onDraw method, you should do as follow :
	 *
	 *   var myGameState = new TW.Gameloop.GameState();
	 *   myGameState.onUpdate = myOnUpdateFunc;
	 *   myGameState.onDraw = myOnDrawFunc;
	 *
	 * You can also insert Layers into the GameState. You can sort them by their z-index in asc or desc order.
	 * Layers allows you to render something on the context of the GameStateStack.
	 *
	 * You can also insert Callbacks into the GameState some callbacks which will be executed when the
	 * GameState is updating.
	 * Notice that callbacks are executed after the onUpdate event.
	 * You can sort the callbacks by specifiying a priority order.
     *
	 * Note that you can also interact with the GameStateStack which own the GameState object.
	 * You can :
	 * - push states
	 * - pop states
	 * - go to a special state in the stack
	 *
	 * Here is an example on which i show how you can push state, pop state and go to a special state :
	 *     this.getGameStateStack().push(newState);
	 *     this.getGameStateStack().pop();
	 *     this.getGameStateStack().goToState("state_name");
	 *
     * @class GameState
	 * @param {Object} params this object should contain severals members
	 *   @param {String} [params.name] which is the name of the State.
	 *   @param {Boolean} [params.sortLayerAsc] which is a boolean.
     *   It must be equal to true if you want to sort Layers by ascendant order.
	 *   Otherwise it must be equal to false. Default value equals true.
	 *   @param {Boolean} [params.sortCallbackAsc] which is a boolean. It must be equal to true if you
	 *   want to sort Callbacks by ascendant order. Otherwise it must be equal to false. default value equals true.
	 * @constructor
	 */
	function GameState(params) {
		this._gameStateStack = null;
		this.layerList = [];
		this.callbackList = [];

		TW.Utils.copyParam(this, params, {
			name:               "",
			sortLayerAsc:       true,
			sortCallbackAsc:    true
		});
	}

	/**
	 * The setSortLayer order allows you to define the sort order of the Layers.
	 * Note that the Layers are ordered by their z-index values.
	 * @method setSortLayerOrder
	 * @param {Boolean} asc represents the sort order.
     * If asc is equal to true it means that your layers will be sort by ascendant order.
	 * Otherwise, your layers will be sorted by descendant order.
	 */
	GameState.prototype.setSortLayerOrder = function(asc) {
		this.sortLayerAsc = asc;
	};

	/**
	 * The setCallbackOrder order allows you to define the sort order of the Callbacks
	 * @method setCallbackOrder
	 * @param {Boolean} asc represents the sort order.
     * If asc is equal to true it means that your layers will be sort by ascendant order.
	 * Otherwise, your layers will be sorted by descendant order.
	 */
	GameState.prototype.setCallbackOrder = function(asc) {
		this.sortCallbackAsc = asc;
	};

	/**
	 * The getName method allows you to retrieve the name which is associated to the current GameState.
	 * @method getName
	 * @return {String} return the name of the current GameState object.
	 */
	GameState.prototype.getName = function() {
		return this.name;
	};

	/**
	 * The addLayer function allow you to add a Layer to the GameState.
	 * By default the addLayer method order Layers by ascendant order by their z-depth values.
	 * @method addLayer
	 * @param {TW.Graphic.Layer} layer the Layer which will have to be added to the GameState.
	 */
	GameState.prototype.addLayer = function(layer) {
		this.layerList.push(layer);
		this.sortLayers();
	};

	/**
	 * This method allows you to remove a layer from the GameState.
	 * @method removeLayer
	 * @param {TW.Graphic.Layer} refLayer a reference to the layer that you want to suppress from the GameState.
	 * @return {Boolean} if the refLayer have been successfully finded and suppressed from the GameState object it will
	 * returns true. Otherwise it will returns false.
	 */
	GameState.prototype.removeLayer = function(refLayer) {
		for (var i = 0; i < this.layerList.length; i++) {
			if (refLayer === this.layerList[i]) {
				this.layerList.splice(i, 1);
				return true;
			}
		}
		return false;
	};

	/**
	 * The addCallback function allow you to add a callback to the current GameState object.
	 * @method addCallback
	 * @param {Object} param This object must contain a number called 'priority' and a reference to the callback
	 * called 'callback'.
	 * @param {Number} [param.priority] represent the execution priority of the callback.
	 * @param {Function} [param.callback] represent the function to execute.
	 * @return {Boolean} return true if param contains a priority and a callback members. otherwise it will
	 * returns false.
	 */
	GameState.prototype.addCallback = function(param) {
		if (param.priority && param.callback) {
			this.callbackList.push(param);
			this.sortCallbacks();
			return true;
		} else {
			return false;
		}
	};

	/**
	 * This method allows you to remove a callback from the current GameState object.
	 * @method removeCallback
	 * @param {Function} refCallback a reference to the callback function to remove from the current GameState object.
	 * @return {Boolean} if the refCallback have been successfully finded and suppressed then the method will return
	 * true. Otherwise it will return false.
	 */
	GameState.prototype.removeCallback = function(refCallback) {
		for (var i = 0; i < this.callbackList.length; i++) {
			if (refCallback === this.callbackList[i]) {
				this.callbackList.splice(i, 1);
				return true;
			}
		}
		return false;
	};

	/**
	 * The sortLayers method allow you to sort layers by their z-order.
	 * @method sortLayers
	 */
	GameState.prototype.sortLayers = function() {
		if (this.sortLayerAsc === true) {
			this.layerList.sort(function(a, b) {return a.zIndex - b.zIndex;});
		} else {
			this.layerList.sort(function(a,b) {return b.zIndex - a.zIndex;});
		}
	};

	/**
	 * The sortCallbacks method allow you yo sort callbacks by their priority member.
	 * @method sortCallbacks
	 */
	GameState.prototype.sortCallbacks = function() {
		if (this.sortCallbackAsc === true) {
			this.callbackList.sort(function(a, b){return a.priority - b.priority;});
		}   else {
			this.callbackList.sort(function(a,b){return b.priority - a.priority;});
		}
	};

	/**
	 * This method allows you to set the GameStateStack parent of the gameState. Note that this method
	 * is use internally
	 * by the GameStateStack implementation.
	 * You should not use it from your own.
	 * @private
	 * @method setGameStateStack
	 * @param {GameStateStack} gameStateStack represents the gameStateStack object which the GameState object
	 * belongs to.
	 */
	GameState.prototype.setGameStateStack = function(gameStateStack) {
	 this._gameStateStack = gameStateStack;
	};

	/**
	 * This method allows you to get the GameStateStack pattern which the current gameState belongs to.
	 * @method getGameStateStack
	 * @return {GameStateStack} if the current GameState object have not already been linked with a GameStateStack
	 * it will return null.
	 */
	GameState.prototype.getGameStateStack = function() {
	 return this._gameStateStack;
	};

	/**
	 * This method is private, you do not have to use it, it is used internally by the GameStateStack class.
	 * @method update
	 * @param {Number} elapsedTime time elapsed since last update call.
	 */
	GameState.prototype.update = function(elapsedTime) {
		this.onUpdate(elapsedTime);
		for (var i = 0; i < this.callbackList.length; i++) {
			this.callbackList[i]();
		}
	};

	/**
	 * This method is private, you do not have to use it, it is used internally by the GameStateStack class.
	 * @method draw
	 * @param {GraphicalContext} canvas_context graphicalContext on which graphical contents will be drawn.
	 */
	GameState.prototype.draw = function(canvas_context) {
		this.onDraw();
		for (var i = 0; i < this.layerList.length; i++) {
			this.layerList[i].draw(canvas_context);
		}
	};

	/**
	 * The main aim of this method is to be overrided by one of your functions. It allows you to make your own onUpdate
	 * methods for the GameStates.
	 * @method onUpdate
	 * @param {Number} elapsedTime represents the amount of milliseconds elapsed since the last update call.
	 */
	GameState.prototype.onUpdate = function(elapsedTime) {

	};

	/**
	 * The main aim of this method is to be overrided by one of your functions. It allows you to execute code
	 * just before layers are drawn on the graphicalContext.
	 * @method onDraw
	 */
	GameState.prototype.onDraw = function() {

	};

	/**
	 * the main aim of this method is to be overrided by one of your functions. It allows you to make your own
	 * onCreation method for the GameState.
	 * @method onCreation
	 */
	GameState.prototype.onCreation = function() {

	};

	/**
	 * The main aim of this method is to be overrided by one of your functions. It allows you to make your own onDelete
	 * method for the GameState
	 * @method onDelete
	 */
	GameState.prototype.onDelete = function() {

	};

	/**
	 * The main aim of this method is to be overrided by one of your functions. It allows you to make your own onWakeUp
	 * method for the GameState.
	 * @method onWakeUp
	 */
	GameState.prototype.onWakeUp = function() {

	};

	/**
	 * The main aim of this method is to be overrided by one of your functions. It allows you to make your own onSleep
	 * method for the GameState.
	 * @method onSleep
	 */
	GameState.prototype.onSleep = function() {

	};

}(TW));
/**
 @module Math
 @namespace Math
 */
var TW = TW || {};

(function(TW) {

    TW.Math = TW.Math ||  {};
    TW.Math.Matrix2D = Matrix2D;

    if (typeof window.define === "function" && window.define.amd) {
        define('math/Matrix2D',['./Vector2D'], function() {
            return Matrix2D;
        });
    }

    /**
     * Matrix2D class, represent a matrix object
     * for perform geometric calculus.
     * The default matrix is the identity matrix.
     *
     * @class Matrix2D
     * @constructor
     *
     * @example
     *`new Matrix2D()` generate this matrix:
     *
     *     [1 0 0]
     *     [0 1 0]
     *     [0 0 1]
     */
    function Matrix2D() {

        /**
         * Internal data that represent matrix.
         * @property {Array} data
         */
        this.data = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

        /**
         Width size of matrix
         @property {Number} width
         */
        this.width = 3;

        /**
         Height size of matrix
         @property {Number} height
         */
        this.height = 3;
    }

    /**
     * Check if the current matrix match the identity.
     *
     * @method isIdentity
     * @return {Boolean} ret true if the current matrix is set to the identity, otherwise it returns false.
     */

    Matrix2D.prototype.isIdentity = function() {
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                if (this.data[i][j] !== (i === j ? 1 : 0)) {
                    return false;
                }
            }
        }
        return true;
    };


    /**
     * Set the current matrix to the specified scalars (a, b, c, d, e, f).
     * **Note that the parameters are given in column major order.**
     *
     * @method setTransform
     * @param a represent the top-left scalar in the matrix
     * @param b represent the middle-left scalar in the matrix
     * @param c represent the top-center scalar in the matrix
     * @param d represent the middle-middle scalar in the matrix
     * @param e represent the top-left scalar in the matrix
     * @param f represent the middle-right scalar in the matrix
     *
     * After a setTransform call, your matrix will look like :
     *     [a c e]
     *     [b d f]
     *     [0 0 1]
     */

    Matrix2D.prototype.setTransform = function(a, b, c, d, e, f) {
        this.data[0][0] = a;
        this.data[0][1] = b;
        this.data[1][0] = c;
        this.data[1][1] = d;
        this.data[2][0] = e;
        this.data[2][1] = f;
    };

    /**
     * Transform the current matrix by the scalars a,b,c,d,e,f.
     * If C if our current matrix and B the matrix made by a,b,c,d,e,f scalars. Then, the transform will be :
     *
     *       C Matrix      B matrix
     *     [Ca, Cc, Ce]   [a, c, e]
     *     [Cb, Cd, Cf] X [b, d, f]
     *     [0,  0,   1]   [0, 0, 1]
     *
     * @method transform
     * @param a
     * @param b
     * @param c
     * @param d
     * @param e
     * @param f
     * @chainable
     */
    Matrix2D.prototype.transform = function(a, b, c, d, e, f) {
        var matrix = new Matrix2D();
        matrix.setTransform(a, b, c, d, e, f);
        var result = this.multiplyMatrix(matrix);
        this.copyMatrix(result);
        return this;
    };

    /**
     * Get the current state of the matrix by a 2d array of floats.
     *
     * @method getData
     * @return {Array} data return the internal data array of the matrix (In column-major order).
     *  **Note**: It is just a copy, we do not allow the user to access original data's of the matrix.
     */

    Matrix2D.prototype.getData = function() {
        return [[this.data[0][0], this.data[0][1]],
            [this.data[1][0], this.data[1][1]],
            [this.data[2][0], this.data[2][1]]];
    };

    /**
    * Set the current matrix to identity.
    *
    * @method identity
    * @chainable
    */
    Matrix2D.prototype.identity = function() {
        var tmp_matrix = Matrix2D.identity();
        this.copyMatrix(tmp_matrix);
        return this;
    };

    /**
     multiplies the current matrix by scale matrix

     @method scale
     @param {Number} x multiplier of abscissa
     @param {Number} y multiplier of ordinate
     @chainable
     */
    Matrix2D.prototype.scale = function(x, y) {
        var tmp_matrix = new Matrix2D();
        tmp_matrix.setTransform(x, 0, 0, y, 0, 0);
        var result = tmp_matrix.multiplyMatrix(this);
        this.copyMatrix(result);
        return this;
    };

    /**
     Apply a rotation to this matrix.

     @method rotate
     @param {Number} angle in degrees
     @chainable
     */
    Matrix2D.prototype.rotate = function(angle) {
        var tmp_matrix = new Matrix2D();
        var rad_angle = angle / 180 * Math.PI;
        tmp_matrix.setTransform(Math.cos(rad_angle), Math.sin(rad_angle),
            -Math.sin(rad_angle), Math.cos(rad_angle),
            0, 0);
        var result = tmp_matrix.multiplyMatrix(this);
        this.copyMatrix(result);
        return this;
    };

    /**
     Apply a translation to this matrix.

     @method translate
     @param {Number} x translation in abscissa
     @param {Number} y translation in ordinate
     @chainable
     */
    Matrix2D.prototype.translate = function(x, y) {
        var tmp_matrix = new Matrix2D();
        tmp_matrix.setTransform(1, 0, 0, 1, x, y);
        var result = tmp_matrix.multiplyMatrix(this);
        this.copyMatrix(result);
        return this;
    };

    /**
     *Transform the current matrix to apply a skew.
     *
     * @method skew
     * @param a the x skew factor
     * @param b the y skew factor
     * @return {Matrix2D} return the current matrix that have been transformed by the skew.
     * @chainable
     */
    Matrix2D.prototype.skew = function(a, b) {
        var tmp_matrix = new Matrix2D();
        tmp_matrix.setTransform(1, a, b, 1, 0, 0);
        var result = tmp_matrix.multiplyMatrix(this);
        this.copyMatrix(result);
        return this;
    };


    /**
     * Set the current matrix data to the matrix given in parameter.
     *
     * @method copyMatrix
     * @param matrix
     * @return {Boolean} return true if matrix is a valid matrix object. Otherwise, false will be returned.
     */

    Matrix2D.prototype.copyMatrix = function(matrix) {
        if (matrix instanceof Matrix2D) {
            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    this.data[i][j] = matrix.data[i][j];
                }
            }
            return false;
        } else {
            return true;
        }
    };


    /**
     Compute the product of two matrix

     @method multiply
     @param {Matrix2D} matrix the matrix to multiplies
     @return {Matrix2D} the result if it's ok, null if an error occurred
     */
    Matrix2D.prototype.multiplyMatrix = function(matrix) {
        if (matrix instanceof Matrix2D) {
            var matrix_temp = new Matrix2D();
            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    matrix_temp.data[i][j] = this.data[i][0] * matrix.data[0][j] +
                        this.data[i][1] * matrix.data[1][j] +
                        this.data[i][2] * matrix.data[2][j];
                }
            }
            return matrix_temp;
        } else {
            return null;
        }
    };

    /**
     * Multiplies the current matrix by a vector 2d.
     * @method multiplyVector
     * @param {Vector2D} vector
     * @return {Vector2D} a new vector transformed by the current matrix
     */
    Matrix2D.prototype.multiplyVector = function(vector) {
        var vector_result = new TW.Math.Vector2D(0, 0);
        var vector_w;

        vector_result.x = this.data[0][0] * vector.x + this.data[1][0] * vector.y + this.data[2][0];
        vector_result.y = this.data[0][1] * vector.x + this.data[1][1] * vector.y + this.data[2][1];
        vector_w = this.data[0][2] * vector.x + this.data[1][2] * vector.y + this.data[2][2];
        vector_result.x /= vector_w;
        vector_result.y /= vector_w;
        return vector_result;
    };

    /**
     * This method transform the context given in parameter by the current matrix.
     *
     * @method transformContext
     * @param context it is the context to transform by the current matrix.
     * @return {Boolean} return true if the method succeed. Otherwise it will returns false.
     */
    Matrix2D.prototype.transformContext = function(context) {
        if (context === null) {
            return false;
        }
        context.transform(this.data[0][0], this.data[0][1], this.data[1][0],
            this.data[1][1], this.data[2][0], this.data[2][1]);
        return true;
    };

    /**
     give a data representation of Matrix

     @method toString
     @return {String} data representation of Matrix
     */
    Matrix2D.prototype.toString = function() {
        var i = 0;
        var j = 0;
        var chain_to_display = "";
        while (i < this.height) {
            j = 0;
            while (j < this.width) {
                chain_to_display += this.data[i][j] + " ";
                j++;
            }
            chain_to_display += "\n";
            i++;
        }
        return chain_to_display;
    };

    /**
     * This method returns an identity matrix.
     *
     * @method identity
     * @static
     * @return {Matrix2D} return an identity matrix object
     */
    Matrix2D.identity = function() {
        var tmp = new Matrix2D();
        tmp.setTransform(1, 0, 0, 1, 0, 0);
        return tmp;
    };

    /**
     * This method returns a rotation matrix
     * **Note that the angle is expressed in degree**
     *
     * @method rotation
     * @static
     * @param angle a scalar expressed in degree who represent the angle of rotation of the matrix to generate.
     * @return {Matrix2D} return a rotation matrix object
     */
    Matrix2D.rotation = function(angle) {
        var tmp = new Matrix2D();
        var angle_rad = angle / Math.PI * 180.0;
        tmp.setTransform(Math.cos(angle_rad), Math.sin(angle_rad), -Math.sin(angle_rad), Math.cos(angle_rad), 0, 0);
        return tmp;
    };

    /**
     * This method return a translation matrix
     *
     * @method translation
     * @static
     * @param x the x translation to integrate in the matrix
     * @param y the y translation to integrate in the matrix
     * @return {Matrix2D}
     */
    Matrix2D.translation = function(x, y) {
        var tmp = new Matrix2D();
        tmp.setTransform(1,0, 0, 1, x, y);
        return tmp;
    };

    /**
     * This method return a scale matrix
     *
     * @method scale
     * @static
     * @param x the abscissa scale factor to integrate in the matrix
     * @param y the ordinate scale factor to integrate in the matrix
     * @return {Matrix2D}
     */
    Matrix2D.scale = function(x, y) {
        var tmp = new Matrix2D();
        tmp.setTransform(x,0, 0, y, 0, 0);
        return tmp;
    };

    /**
     * This method return a skew matrix
     *
     * @method skew
     * @static
     * @param a the factor of skew on the y axis
     * @param b the factor of skew on the x axis
     * @return {Matrix2D}
     */
    Matrix2D.skew = function(a, b) {
        var tmp = new Matrix2D();
        tmp.setTransform(1,a, b, 1, 0, 0);
        return tmp;
    };


}(TW));

/**
 @module Graphic
 @namespace Graphic
 */

var TW = TW || {};

(function(TW) {

    TW.Graphic = TW.Graphic ||  {};
    TW.Graphic.GraphicObject = GraphicObject;

    if (typeof window.define === "function" && window.define.amd) {
        define('graphic/GraphicObject',['../math/Matrix2D', '../utils/Inheritance'], function() {
            return GraphicObject;
        });
    }

    /**
     * GraphicObject represent an object that has a relationship with graphical context.
     * It is the root class of every graphical component of the framework.
     *
     * ## General
     * It provide many method for manipulate object in 2D space,
     * keeping a internal matrix. It contain also dimensions, and a reference point
     * for all transformations (center point).<br />
     * Each object can have a parent, which is informed to any child modification, with the method `onChange()`.
     *
     * ## extend this class
     * All 2D graphical objects should inherit from this class.
     * All inherited class should implement the {{#crossLink "Graphic.GraphicObject/draw"}}{{/crossLink}} method,
     * not implemented by default.<br />
     * Inherited class must also inform the parent (if any) after each modification that influence the graphical
     * render, by calling protected method {{#crossLink "Graphic.GraphicObject/notifyParentChange"}}{{/crossLink}}
     *
     *
     * @class GraphicObject
     * @param {Object} [param] it is an object that represent the parameters of the graphicalObject to set.
     *  @param {Number} [param.zIndex=0] define display order with other graphic elements. default to 0.
     *  @param {Matrix2D} [param.matrix] matrix to set to the object. default to identity matrix.
     *  @param {Number} [param.alpha=1.0] set the transparency, between 0 and 1. default to 1 (completely opaque).
     *  @param {Number} [param.width=0] width of the element.
     *  @param {Number} [param.height=0] height of the element.
     *  @param {Number} [param.x=0] position on X axis.
     *  @param {Number} [param.y=0] position on Y axis.
     *  @param {Number} [param.parent=null] parent of the element.
     *  @param {Number} [param.xCenter=0] x position of the center in the current object
     *  @param {Number} [param.yCenter=0] y position of the center in the current object
     * @constructor
     */
    function GraphicObject(param) {
		TW.Utils.copyParam(this, param, {
			width:          0,
			height:         0,
			x:              0,
			y:              0,
			xCenterPoint:   0,
			yCenterPoint:   0,
			zIndex:         0,
			alpha:          1.0,
			matrix:         TW.Math.Matrix2D.identity(),
			parent:         null
		});
    }

    /**
     * This method is aimed to be overrides by the classes who extends GraphicObject class.
     *
     * @method draw
     * @param {CanvasRenderingContext2D} context represent the context of the canvas to draw on.
     */
    GraphicObject.prototype.draw = function(context) {

    };

    /**
     * This method allows the user to get the parent of the current GraphicalObject.
     *
     * @method getParent
     * @return {GraphicObject} return the parent of the current GraphicalObject.
     */
    GraphicObject.prototype.getParent = function () {
        return this.parent;
    };

    /**
     * This method allows the user to set the parent of the current GraphicObject.
     *
     * @method setParent
     * @param {GraphicObject} parent the parent GraphicalObject.
     * @return {Boolean} return false if the setParent method fails otherwise it returns true.
     */
    GraphicObject.prototype.setParent = function(parent) {
        if (parent instanceof TW.Graphic.GraphicObject) {
            this.parent = parent;
            return true;
        }	else {
            return false;
        }
    };

    /**
     * This method allows the user to get the dimensions of the current GraphicObject.
     *
     * @method getDimensions
     * @return {Object} return an object that contains the width and the height values of the current GraphicObject.
     */
    GraphicObject.prototype.getDimensions = function() {
        return {width: this.width, height: this.height};
    };

    /**
     * This method allows the user to get the coordinates of the current GraphicObject.
     *
     * @method getLocalPosition
     * @return {Object} return an object that contains the x and the y position of the GraphicObject
     *  onto its parent.
     */
    GraphicObject.prototype.getLocalPosition = function() {
        return {x: this.x, y: this.y};
    };

    /**
     * This method set the dimensions of the GraphicObject.
     *
     * @method setDimensions
     * @param {Object} obj contains the width and the height to apply to the current GraphicObject.
     *  @param {Number} obj.width
     *  @param {Number} obj.height
     * @return {Boolean} return false if the obj does not contains width and height or
     *  if their values are not positives numbers.
     */
    GraphicObject.prototype.setDimensions = function(obj) {
        if (obj && obj.width && obj.height && obj.width > 0 && obj.height > 0) {
            this.width = obj.width;
            this.height = obj.height;
            this.notifyParentChange();
            return true;
        } else {
            return false;
        }
    };

    /**
     * This method allow the user to set the local position of the GraphicObject.
     *
     * @method setLocalPosition
     * @param {Object} obj contains the x and the y position to apply to the current GraphicObject.
     *  @param {Number} obj.x position on X axis
     *  @param {Number} obj.y position on Y axis
     * @return {Boolean} return false if the obj does not contains x and y components or
     *  if their values are not defined.
     */
    GraphicObject.prototype.setLocalPosition = function(obj) {
        if (obj && obj.x && obj.y) {
            this.x = obj.x;
            this.y = obj.y;
            this.notifyParentChange();
            return true;
        } else {
            return false;
        }
    };

    /**
     * This method allow the user to get the z-index value.
     *
     * @method getZIndex
     * @return {Number}
     */
    GraphicObject.prototype.getZIndex = function() {
        return this.zIndex;
    };

    /**
     * This method allow you to set the z-index value of the GraphicObject
     *
     * @method setZIndex
     * @param {Number} value the value to affect to the zIndex of the GraphicalObject.
     */
    GraphicObject.prototype.setZIndex = function(value) {
        this.zIndex = value;
        this.notifyParentChange();
    };

    /**
     * This method allow you to get the alpha value of GraphicObject
     * *Note: alpha means the opacity factor of the GraphicObject, alpha is always between 0.0 and 1.0.*
     *
     * @method getAlpha
     * @return {Number} The alpha value of the GraphicObject.
     */
    GraphicObject.prototype.getAlpha = function() {
        return this.alpha;
    };

    /**
     * This method allow you to set the alpha value of the GraphicObject.
     * *Note: alpha must be a number factor between 0.0 and 1.0*.
     *
     * @method setAlpha
     * @param {Number} alpha
     */
    GraphicObject.prototype.setAlpha = function(alpha) {
        this.alpha = alpha;
        this.notifyParentChange();
    };

    /**
     * This method allow you to translate the GraphicalObject,
     * Internally this method modify the GraphicObject's matrix.
     *
     * @method translate
     * @param {Number} x this is the translation scalar of the x axis.
     * @param {Number} y this is the translation scalar of the y axis.
     * @return {GraphicObject} this is the GraphicObject itself, it allows chainable calls of translate.
     */
    GraphicObject.prototype.translate = function(x, y) {
        this.matrix.translate(x, y);
        this.notifyParentChange();
        return this;
    };

    /**
     * This method allow you to set the position of the GraphicalObject.
     * Internally, it reset the translation matrix and set it with the x and y scalars.
     *
     * @method setPosition
     * @param {Number} x this is the scalar of the x axis.
     * @param {Number} y this is the scalar of the y axis.
     */
    GraphicObject.prototype.setPosition = function(x, y) {
        //this.matrix = this.matrix.identity();
        this.x = x;
        this.y = y;
        this.notifyParentChange();
        //this.matrix.translate(x, y);
    };

    /**
     * This method allow you to rotate the Graphical object around the center point of the GraphicalObject.
     *
     * @method rotate
     * @chainable
     * @param {Number} angle represent the angle of rotation, it's expressed in degree.
     * @return {GraphicObject} return the object itself. Allow the chainable calls.
     */
    GraphicObject.prototype.rotate = function(angle) {
        this.matrix.rotate(angle);
        this.notifyParentChange();
        return this;
    };

    /**
     * this method allow you to do a scale on the GraphicObject.
     *
     * @method scale
     * @chainable
     * @param {Number} x this is the x scale factor
     * @param {Number} y this is the y scale factor
     * @return {GraphicObject} return the object itself. Allow chainable calls.
     */
    GraphicObject.prototype.scale = function(x, y) {
        this.matrix.scale(x, y);
        this.notifyParentChange();
        return this;
    };

    /**
     * This method allow you to do a skew transform on the GraphicObject.
     *
     * @method skew
     * @chainable
     * @return {GraphicObject} return the object itself. Allow chainable calls.
     * @param {Number} a the factor of skew on the y axis
     * @param {Number} b the factor of skew on the x axis
     */
    GraphicObject.prototype.skew = function(a, b) {
        this.matrix.skew(a, b);
        this.notifyParentChange();
        return this;
    };

    /**
     * This method allow you to set the centerPoint of the GraphicObject. centerPoint means the point around the
     * rotations are done. it also means the translation origin point of the GraphicObject.
     * *Note that the methods `setCenterPoint(centerPoint);` and `setCenterPoint(x, y);` are doing the same thing,
     * only the syntax differs.
     *
     * @method setCenterPoint
     * @param {Number} x represent the x axis value of the centerPoint
     * @param {Number} y represent the y axis value of the centerPoint
     */
    GraphicObject.prototype.setCenterPoint = function(x, y) {
        this.xCenterPoint = x;
        this.yCenterPoint = y;
        this.notifyParentChange();
        return true;
    };

    /**
     * This method allow you to get the CenterPoint of the GraphicalObject.
     *
     * @method getCenterPoint
     * @return {Object} return an object containing the x and y coordinate of the CenterPoint. Like `{x:12, y:65}`.
     */
    GraphicObject.prototype.getCenterPoint = function() {
        return {x:this.xCenterPoint, y:this.yCenterPoint};
    };


    /**
     * This method notify the parent that a change has been done, and that it should clear his cache.
     *
     * @method notifyParentChange
     * @protected
     */
    GraphicObject.prototype.notifyParentChange = function() {
        if (this.parent) {
            this.parent.onChange(this);
        }
    };

}(TW));

/**
 @module Graphic
 @namespace Graphic
 */

var TW = TW || {};

(function(TW) {

    TW.Graphic = TW.Graphic ||  {};
    TW.Graphic.SpatialContainer = SpatialContainer;

    if (typeof window.define === "function" && window.define.amd) {
        define('graphic/SpatialContainer',[], function() {
            return SpatialContainer;
        });
    }

    /**
     * A spatial container is a data structure used for storage of spatial 2D objects
     * (generally {{#crossLink "Graphic.GraphicObject" }}{{/crossLink}}).
     * It propose many method for manipulate these objects using theirs coordinates.
     *
     * This class provide a basic implementation of all methods,
     * and also represent an interface to others spatial containers.
     * Different containers provides different complexities, and for each situation,
     * someone are more adapted than others.
     *
     * @class SpatialContainer
     * @constructor
     */
    function SpatialContainer() {
        this.containerList = [];
    }

    /**
     * This method allow you to add a GraphicalObject to the SpatialContainer
     *
     * @method addElement
     * @param {Object} element this object will be added to the internal list of the SpatialContainer.
     *  element *SHOULD BE* a GraphicObject, otherwise the spatial container would have undetermined behavior.
     */
    SpatialContainer.prototype.addElement = function(element) {
        this.containerList.push(element);
        this.containerList.sort(function(a, b) {
            return (a.zIndex - b.zIndex);
        });
    };

    /**
     * This method allow you to remove a graphical element from the SpatialContainer
     *
     * @method removeElement
     * @param {Object} element the reference to the object to remove from the SpatialContainer List.
     * @return {Boolean} true if the element to remove from the list was found. Otherwise it returns false.
     */
    SpatialContainer.prototype.removeElement = function(element) {
        for (var i = 0; i < this.containerList.length; i++) {
            if (element === this.containerList[i]) {
                this.containerList.splice(i, 1);
                return true;
            }
        }
        return false;
    };

    /**
     * This method allow you to apply a callback for every GraphicObject contained in the SpatialContainer.
     *
     * The callback shouldn't remove directly an element until the end of `applyAll`.
     * The behavior in this case is undefined.
     *
     * @method applyAll
     * @param {Function} callback must be a function object defined like
     *   `function callback(element){Do some things;}`
     *  @param {Object} callback.element element contained in spatial container.
     * @return {Boolean} true if callback is a function object and has been applied to every GraphicObject;
     *  otherwise false.
     */
    SpatialContainer.prototype.applyAll = function(callback) {
        if (typeof(callback) === "function") {
            for (var i = 0; i < this.containerList.length; i++) {
                callback(this.containerList[i]);
            }
            return true;
        } else {
            return false;
        }
    };

    /**
     * This method allow you to apply a callback to the GraphicObject who are at the specified position.
     * __TODO: not available__
     *
     * @method applyToPoint
     * @param {Number} x the x position where the GraphicObject must be to get the callback applied on them
     * @param {Number} y the y position where the GraphicObject must be to get the callback applied on them.
     * @param {Function} callback to apply to every GraphicObject which position match the x, y parameters.
     */
    SpatialContainer.prototype.applyToPoint = function(x, y, callback) {
        for (var i = 0; i < this.containerList.length; i++) {
            if (this.containerList[i].x === x && this.containerList[i].y === y) {
                callback(this.containerList[i]);
            }
        }
    };

    /**
     * It returns the det of two vectors, it is used internally by the applyToZone method.
     *
     * @method computeDet
     * @param {Object} d represent a vector
     * @param {Object} t represent a vector
     * @return {Number} return the det of the vectors d and t.
     * @private
     */
    SpatialContainer.prototype._computeDet = function(d, t) {
        return ((d.x * t.y) - (d.y * t.x));
    };

    /**
     * This method allow you to apply a callback only on the object that are inside of the polygon
     * specified by the points.
     *
     * @method applyToZone
     * @param {Array} pointsArray array of points like `{{10,0},{0,10},{2,3}}
     *  *Note that the polygon MUST BE composed at least of 3 points,
     *  otherwise the method will not do anything and then it'll return false.*
     * @param {Function} callback function to be called on every GraphicObject that are inside of
     *  the polygon specified by pointsArray.
     * @return {Boolean} return true if the pointArray was a valid array of points, otherwise it will return false.
     */
    SpatialContainer.prototype.applyToZone = function(pointsArray, callback) {

        if (!(pointsArray && pointsArray.length >= 3)) {
            return false;
        }
        for (var j = 1; j < this.containerList.length; j++) {
            var outside = false;
            for (var i = 1; i < pointsArray.length; i++) {
                var vector_polygon_edge = {x: (pointsArray[i].x - pointsArray[i - 1].x), y: (pointsArray[i].x -
                    pointsArray[i - 1].x)};
                var vector_to_point = {x: (this.containerList[j].x -
                    pointsArray[i - 1].x), y: (this.containerList[j].y -
                    pointsArray[i - 1].y)};
                var det = this._computeDet(vector_polygon_edge, vector_to_point);
                if (det > 0) {
                }
                outside = true;
            }
            if (outside === false) {
                callback(this.containerList[j]);
            }
        }
    };

}(TW));

/**
 @module Graphic
 @namespace Graphic
 */
var TW = TW || {};

(function(TW) {

    TW.Graphic = TW.Graphic ||  {};
    TW.Graphic.Camera = Camera;

    if (typeof window.define === "function" && window.define.amd) {
        define('graphic/Camera',['../math/Matrix2D'], function() {
            return Camera;
        });
    }

    /**
     * The Camera class allow you to create a camera who has the purpose to simulate a camera on some layers.
     * Each {{#crossLink "Graphic.Layer" }}{{/crossLink}} or {{#crossLink "Graphic.Window" }}{{/crossLink}} contain
     * a camera for moving te point of view displayed.
     *
     * ### Manipulate the camera
     *
     * The movement of the camera is based on an internal matrix, representing the point of view
     * of the camera.
     * This class provide an useful way to moving in the space without using directly matrices.
     * All manipulation methods matrix provided are applied in a fixed order:
     *
     *  - translation
     *  - rotation
     *  - skew
     *  - scale
     *
     * the aim is to use each type of transformation separately, regardless of the order of method calls.
     *
     *
     * It's also possible to directly use the matrix methods, but both methods are not compatible,
     * because calling a method from the camera will overwrite the matrix.<br />
     * __If you choose to directly manipulate the matrix, be careful to not use matrix transformations method
     * provided by the Camera class.__
     *
     * ### Extending the class
     *
     * The Camera class provide only basic features and is destined to be extended.
     * The two important methods are `prepare` and `update`
     *
     *  - `prepare` is called for preparing the graphic rendering (just applying matrix by default).<br />
     *      {{#crossLink "Graphic.Camera/prepare" }}More information here{{/crossLink}}
     *  - `update` is an optional method (and is not provided in this class) called regularly,
     *  useful for adding a dynamic behavior.<br />
     * Note that you can take advantage of Javascript by adding directly an `update` method on the Camera instance.
     *
     * @class Camera
     * @constructor
     */
    function Camera() {
        this._matrix = new TW.Math.Matrix2D();
        this._translation = {x: 0, y: 0 };
        this._rotation = 0;
        this._scale = {x: 1 ,y: 1 };
        this._skew = {a: 0, b: 0 };
    }

    /**
     * This method allow you to get the internal matrix of the camera
     *
     * @method getMatrix
     * @return {Matrix2D}
     */
    Camera.prototype.getMatrix = function() {
        return this._matrix;
    };

    /**
     * This method allow you to set directly the matrix.
     *
     * Note that don't automatically refresh the associated layer.
     * You should refresh the Layer after this operation.
     *
     * This method is not compatible with other matrix Camera's method (`translate`, `rotate`,
     * `skew` or `scale`).Calling one of these method will recreate the matrix and erasing your matrix.
     * For applying transformations, you should modify directly the matrix.
     *
     * @method setMatrix
     * @param {Matrix2D} matrix
     */
    Camera.prototype.setMatrix = function(matrix) {
        this._matrix = matrix;
    };

    /**
     * prepare is called before each draw on the canvas.
     * The canvas 2D context must be completely reset.<br />
     * By default, context matrix are multiplied by internal matrix.
     * save and restore operations are done by the caller.
     *
     * @method prepare
     * @param {CanvasRenderingContext2D} context The canvas context which will be used to draw.
     */
    Camera.prototype.prepare = function(context) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        this._matrix.transformContext(context);
    };

    /**
     * Apply a translation to the camera.
     *
     * @method translate
     * @chainable
     * @param x
     * @param y
     * @return {Camera}
     */
    Camera.prototype.translate = function(x, y) {
        this._translation = {x: x, y: y};
        this._updateMatrix();
        return this;
    };

    /**
     * Apply a rotation to the camera.
     *
     * @method rotate
     * @chainable
     * @param {Number} angle rotation angle in degrees.
     * @return {Camera}
     */
    Camera.prototype.rotate = function(angle) {
        this._rotation = angle;
        this._updateMatrix();
        return this;
    };
    /**
     * Apply a scale transformation to the camera.
     *
     * @method scale
     * @chainable
     * @param {Number} x
     * @param {Number} y
     * @return {Camera}
     */
    Camera.prototype.scale = function(x, y) {
        this._scale = {x: x, y: y };
        this._updateMatrix();
        return this;
    };

    /**
     * Apply a skew transformation to the camera.
     *
     * @method skew
     * @chainable
     * @param {Number} a
     * @param {Number} b
     * @return {Camera}
     */
    Camera.prototype.skew = function(a, b) {
        this._skew = {a: a, b: b};
        this._updateMatrix();
        return this;
    };

    /**
     * @method _updateMatrix
     * @private
     */
    Camera.prototype._updateMatrix = function() {
        this._matrix.identity()
            .translate(this._translation.x, this._translation.y)
            .rotate(this._rotation)
            .skew(this._skew.a, this._skew.b)
            .scale(this._scale.x, this._scale.y);
    };

}(TW));
/**
 @module Graphic
 @namespace Graphic
 */

var TW = TW || {};

(function(TW) {
    TW.Graphic = TW.Graphic ||  {};
    TW.Graphic.Layer = Layer;

    if (typeof window.define === "function" && window.define.amd) {
        define('graphic/Layer',['./GraphicObject', './SpatialContainer', './Camera', '../utils/Inheritance'], function() {
            TW.Utils.inherit(Layer, TW.Graphic.GraphicObject);
            return Layer;
        });
    } else {
        TW.Utils.inherit(Layer, TW.Graphic.GraphicObject);
    }

    /**
     * The Layer class can hold several GraphicObjects and it provides some transformations methods to move or
     * scale all the GraphicalObjects that it contains. This is helpful when you want for example apply
     * the same plane transformation to some GraphicalObjects.
     *
     * @class Layer
     * @extends GraphicObject
     * @constructor
     * @param {Object} params All properties given to {{#crossLink "Graphic.GraphicObject"}}{{/crossLink}}
     *   are available.
     *   @param {Camera} [params.camera] camera used be the layer. if not set, a new Camera is created.
     *   @param {SpatialContainer} [params.spatialContainer]
     *   @param {CanvasRenderingContext2D} [params.localCanvas] you can set directly the canvas used by the layer.
     */
    function Layer(params) {
        TW.Graphic.GraphicObject.call(this, params);

        this._camera =  params.camera ? params.camera : new TW.Graphic.Camera();
        this._spatialContainer = params.spatialContainer ? params.spatialContainer :
            new TW.Graphic.SpatialContainer();
        this._localCanvas = params.localCanvas ? params.localCanvas :
            document.createElement('canvas').getContext("2d");
        this._localCanvas.canvas.width = params.width;
        this._localCanvas.canvas.height = params.height;
        this._needToRedraw = true;
    }

    /**
     * This method allow the user to get the current camera used into the Layer.
     * @method getCamera
     * @return {TW.Graphic.Camera}
     */

    Layer.prototype.getCamera = function() {
        return this._camera;
    };




    /**
     * This method allow the user to draw on the canvas's context.
     * If nothing has changed in the childs of the layer, then a buffered layer is printed on the canvas.
     * Otherwise all the canvas is redraw.
     *
     * @method draw
     * @param {CanvasRenderingContext2D} context
     */
    Layer.prototype.draw = function(context) {
        if (this._needToRedraw === true) {
            this._localCanvas.save();
            this._camera.prepare(this._localCanvas);
            //this._localCanvas.translate(-this.xCenterPoint, -this.yCenterPoint);
            this._spatialContainer.applyAll(function(child) {
                child.draw(this._localCanvas);
            }.bind(this));
            this._localCanvas.restore();
            this._needToRedraw = false;
        }
        context.save();
        context.translate(this.x, this.y);
        this.matrix.transformContext(context);
	    context.drawImage(this._localCanvas.canvas, -this.xCenterPoint, -this.yCenterPoint, this.width, this.height);
        //context.drawImage(this._localCanvas.canvas, 0, 0, this.width, this.height);
        context.restore();
    };

    /**
     * This method allow you to set the dimensions of the layer.
     *
     * @method setDimensions
     * @param {Object} obj this object must contains the width and the height of the object like this:
     * `{obj.width, obj.height}`
     * @return {Boolean} this method returns false if the obj parameter isn't a valid object, otherwise this method
     * returns true.
     */
    Layer.prototype.setDimensions = function(obj) {
        if (obj && obj.width && obj.height && obj.width > 0 && obj.height > 0) {
            this.width = obj.width;
            this.height = obj.height;
            this._localCanvas.width = obj.width;
            this._localCanvas.height = obj.height;
            this.notifyParentChange();
            return true;
        } else {
            return false;
        }
    };

    /**
     * This method allow you to set the camera object of the layer.
     *
     * @method setCamera
     * @param {Camera} camera this object is the camera object to affect to the Layer.
     */
    Layer.prototype.setCamera = function(camera) {
        this.notifyParentChange();
        this._camera = camera;
    };

    /**
     * This method allow you yo get the spatial container of the Layer.
     *
     * @method getSpatialContainer
     * @return {TW.Graphic.SpatialContainer} this function returns the spatial container of the layer. If no spatial
     * container was assigned to the Layer object. Then this method will returns null
     */
    Layer.prototype.getSpatialContainer = function() {
        return this._spatialContainer;
    };

    /**
     * This method allow you to set the spatial container of the Layer.
     *
     * @method setSpatialContainer
     * @param spatialContainer this parameter must be a valid spatialContainer, otherwise the method will have an
     * undefined behavior.
     * @return {Boolean} this method will returns true if the spatialContainer is a valid object,
     * otherwise it will return false.
     */
    Layer.prototype.setSpatialContainer = function(spatialContainer) {
        if (spatialContainer) {
            this.notifyParentChange();
            this._spatialContainer = spatialContainer;
            return true;
        } else {
            return false;
        }
    };

    /**
     * This method will allow you to add a child to the current Layer.
     *
     * @method addChild
     * @param {GraphicObject} graphicObject this parameter must be a valid GraphicObject, otherwise the method
     * will have an undefined behavior.
     * @return {Boolean} this method will return false if the graphicObject parameter is a valid object.
     * Otherwise it will returns true.
     */
    Layer.prototype.addChild = function(graphicObject) {
        if (graphicObject) {
            this._spatialContainer.addElement(graphicObject);
            graphicObject.setParent(this);
            this.onChange(graphicObject);
            return true;
        } else {
            return false;
        }
    };

    /**
     * This method will allow you to remove a child from the current Layer.
     *
     * @method rmChild
     * @param {GraphicObject} graphicObject this parameter is the GraphicObject that the method will try
     * to find inside the child of the current layer.
     * @return {Boolean} if the graphicObject was found in the childs of the current layer then the method
     * will returns true, otherwise the method will returns true.
     */
    Layer.prototype.rmChild = function(graphicObject) {
        this._spatialContainer.removeElement(graphicObject);
        this.onChange(null);
    };


    /**
     * This method will allow you to update the layer and all the childs within the layer.
     *
     * @method update
     */
    Layer.prototype.update = function() {
        this._spatialContainer.applyAll(function(child) {
            if (child.update) {
                child.update();
            }
        });
    };

    /**
     * This method will allow you to remove a child from the current Layer.
     *
     * @method rmChild
     * @param {GraphicObject} graphicObject this parameter is the GraphicObject that the method will try
     * to find inside the child of the current layer.
     * @return {Boolean} if the graphicObject was found in the childs of the current layer then the method
     * will returns true, otherwise the method will returns true.
     */
    Layer.prototype.rmChild = function(graphicObject) {
        this._spatialContainer.removeElement(graphicObject);
        this.onChange(null);
    };


    /**
     * This method will allow you to update the layer and all the childs within the layer.
     *
     * @method update
     */
    Layer.prototype.update = function(elapsed_time) {
        this._spatialContainer.applyAll(function(child) {
            if (child.update) {
                child.update(elapsed_time);
            }
        });
    };

    /**
     * This method will be called when a child is changed.
     * By using this method it will notice the current Layer to redraw the local canvas.
     *
     * This method is called automatically when a child object change.
     * You can call this method for clear internal cache.
     *
     * @method onChange
     * @param {GraphicObject} [child] this object represent the child who has been changed.
     */
    Layer.prototype.onChange = function(child) {
        this._needToRedraw = true;
        return this.notifyParentChange();
    };

}(TW));

/**
 @module Graphic
 @namespace Graphic
 */

var TW = TW || {};

(function(TW) {

    TW.Graphic = TW.Graphic ||  {};
    TW.Graphic.Window = Window;

    if (typeof window.define === "function" && window.define.amd) {
        define('graphic/Window',['./Layer', '../utils/Inheritance'], function() {
            TW.Utils.inherit(Window, TW.Graphic.Layer);
            return Window;
        });
    } else {
        TW.Utils.inherit(Window, TW.Graphic.Layer);
    }

    /**
     * This class represent a window associated to a canvas element.
     * It's the first class used in Graphic module, wrapping all graphic objects.
     *
     * @class Window
     * @extends Layer
     * @constructor
     * @param {HTMLCanvasElement} [canvas] main canvas for the window
     */
    function Window(canvas) {
        this._realCanvas = (canvas === undefined ? document.createElement('canvas') : canvas);
        TW.Graphic.Layer.call(this, {
            localCanvas: this._realCanvas.getContext("2d"),
            width:	canvas.width,
            height: canvas.height
        });
    }

    /**
     * @method getCanvas
     * @return {HTMLCanvasElement} associated canvas to the window, that can be added in DOM.
     */
    Window.prototype.getCanvas = function() {
        return this._realCanvas;
    };

    /**
     * @method setCanvas
     * @param {HTMLCanvasElement} canvas a HTML canvas to associate to the window.
     */
    Window.prototype.setCanvas = function(canvas) {
        this._realCanvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.notifyParentChange();
    };

    /**
     * Draw all graphic elements on the associated canvas.
     *
     * @method draw
     */
    Window.prototype.draw = function() {
        //if (this._needToRedraw === true) {
            this._localCanvas.save();
            this._camera.prepare(this._localCanvas);
            this._spatialContainer.applyAll(function(child) {
                child.draw(this._localCanvas);
            }.bind(this));
            this._localCanvas.restore();
            this._needToRedraw = false;
       // }
    };

}(TW));

/**
 @module Gameloop
 @namespace Gameloop
 */

var TW = TW || {};

(function(TW) {

	TW.Gameloop = TW.Gameloop ||  {};
	TW.Gameloop.GameStateStack = GameStateStack;

	if (typeof window.define === "function" && window.define.amd) {
		define('gameloop/GameStateStack',['./Gameloop', './GameState', '../graphic/Window', '../utils/Inheritance'], function() {
			return GameStateStack;
		});
	}

	/**
	 * This class allows you to manipulate some GameStates. It is quite useful and widely used in Game Programming
	 * The default usage of this GameStateStack is to be added to a Gameloop which will call periodically the
	 * GameStateStack's update and draw methods.
	 * The GameStateStack class act like the Window class. When you create a GameStateStack object you must give
	 * it a canvas.
	 * You can add and suppress GameState objects from the GameStateStack.
	 * The main difference with the Window class is that the GameStateStack organize Layers in differents GameStates.
	 * And the focused GameState can change be change at runtime.
	 *
	 * Let's take an example, you want to do a little game which contains 2 states :
	 *
	 * - Paused
	 * - In Game
	 *
	 * Each state have to contains its own layers which represent it. But it is not the purpose of this Class.
	 * Refer to GameState class for more informations about that.
	 *
	 * You have to add the first State to the GameStateStack, in our case it is the "In Game" state.
	 * Then you can add the GameStateStack to the Gameloop.
	 * Then during updating process. Your "In Game" state will be updated. And during its update it can change the
	 * current state of the GameStateStack.
	 * For example, if the "In Game" state detect that you have pressed "space" to set the game in pause.
	 * Then a new State must be pushed to the GameStateStack which will be the "Paused" state.
	 *
	 * Then, the pause state will be the focused state. if it detects that the "space" key is pressed again. Then the
	 * current state of the GameStateStack must be poped.
	 * Then, the current state will be again the "In Game" state, and it will be resume where the "pause" state have
	 * been created.
	 * That's why this class is called a Stack, because internally, the GameStates are stacked and saved. It allows you
	 * to manage and save differents states.
	 * Like in the previous example you can save the current state of the game and set it in pause.
	 *
	 * Note that all the States are drawn on the canvas during draw procedure. Also note that only the last State which
	 * have been added to the GameState is updated.
	 * That's why all other states are paused. Because they are no more updated.
	 *
     * @class GameStateStack
	 * @constructor
	 * @param {Canvas} canvas the canvas on which the States will be drawn.
	 */
	function GameStateStack(canvas) {
		this.viewStack = [];
		if (canvas) {
			this.localContext = canvas.getContext("2d");
		} else {
			this.localContext = null;
		}
	}

	/**
	 * This method allows you to add a State to the GameStateStack. Notice that when you push a GameState other states
	 * will be paused, It means that only the State that you've add to the GameStatePattern will be updated.
	 * @method push
	 * @param {GameState} gameState The gameState which will be the current GameState to be active.
	 */
	GameStateStack.prototype.push = function(gameState) {
		if (this.viewStack.length > 0) {
			this.viewStack[this.viewStack.length - 1].onSleep();
		}
		this.viewStack.push(gameState);
		gameState.setGameStateStack(this);
		gameState.onCreation();
	};

	/**
	 * This method allows you to destroy the current GameState. Notice that when you pop a GameState it will be
	 * destroyed and the previous state will be resume.
	 * @method pop
	 */
	GameStateStack.prototype.pop = function() {
		if (this.viewStack.length > 0) {
			var index_to_pop = this.viewStack.length - 1;
			this.viewStack[index_to_pop].onDelete();
			this.viewStack.splice(index_to_pop, 1);
		}
		if (this.viewStack.length > 0) {
			this.viewStack[this.viewStack.length - 1].onWakeUp();
		}
	};

	/**
	 * This method try to find a State in the stack which has a specific name.
	 * It allows you to jump from a state to another.
	 * @param {String} name this parameter specify the name of the state to find in the stack.
	 * @return {Boolean} returns true if a state with the specified name has been finded and set active on the stack.
	 * Otherwise it will return false.
	 */
	GameStateStack.prototype.goToState = function(name) {
		var i = this.viewStack.length > 0 ? this.viewStack.length - 1 : 0;
		for (; i >= 0; i--) {
			if (this.viewStack[i].getName() === name) {
				var number_of_pop_needed = this.viewStack.length - i;
				if (number_of_pop_needed > 0) {
					number_of_pop_needed--;
				}
				while (number_of_pop_needed > 0) {
					this.pop();
					number_of_pop_needed--;
				}
				return true;
			}
		}
		return false;
	};

	/**
	 * This method allows you to update the GameStateStack, notice that only the last GameState will be updated.
	 * @method update
	 * @param elapsedTime
	 */
	GameStateStack.prototype.update = function(elapsedTime) {
		if (this.viewStack.length > 0) {
			this.viewStack[this.viewStack.length - 1].update(elapsedTime);
		}
	};

	/**
	 * This method allows you to draw the GameStateStack, notice that all the GameState will be drawn. From the last
	 * GameState to the first.
	 * @method draw
	 */
	GameStateStack.prototype.draw = function() {
		if (this.localContext) {
			this.localContext.clearRect(0, 0, this.localContext.canvas.width, this.localContext.canvas.height);
			for (var i = 0; i < this.viewStack.length; i++) {
				this.viewStack[i].draw(this.localContext);
			}
		}
	};

}(TW));
/**
 * This module contain all classes relating to time management and
 * scheduling actions by object or group objects.
 *
 * The {{#crossLink "Gameloop.Gameloop"}}{{/crossLink}} class is the first brick for make a new game,
 * Playing and pausing the game easily.
 *
 * @module Gameloop
 * @main
 */


var TW = TW || {};

if (typeof window.define === "function" && window.define.amd) {

    define('gameloop',[
        './gameloop/Gameloop',
        './gameloop/GameStateStack',
        './gameloop/GameState'
    ], function() {
        return TW.Gameloop;
    });

}
;
/**
 @module Graphic
 @namespace Graphic
 */

var TW = TW || {};

(function(TW) {

    TW.Graphic = TW.Graphic ||  {};
    TW.Graphic.Shape = Shape;

    if (typeof window.define === "function" && window.define.amd) {
        define('graphic/Shape',['./GraphicObject', '../utils/Inheritance'], function() {
            TW.Utils.inherit(Shape, TW.Graphic.GraphicObject);
            return Shape;
        });
    } else {
        TW.Utils.inherit(Shape, TW.Graphic.GraphicObject);
    }

    /**
     * The Shape class is an abstract object who provides tool to draw some primitive Shapes.
     * You should not use this class cause it is an abstract class who have the purpose to be extended
     * to implements basic shape drawing.
     * Note that the Shape class extends the GraphicObject class.
     *
     * @class Shape
     * @extends GraphicObject
     * @constructor
     * @param {Object} [params] set of parameters for configure this objects.
     *   *params* is given to {{#crossLink "Graphic.GraphicObject"}}{{/crossLink}} constructor.
     *   @param [params.color="black"] content color (in filled mode)
     *   @param [params.strokeColor="black"] stroke color (in wired mode)
     *   @param {"WIRED"|"FILLED"} [params.mode="WIRED"] display mode for shape.
     */
    function Shape(params) {
        TW.Graphic.GraphicObject.call(this, params);
	    TW.Utils.copyParam(this, params, {
		    color:          "black",
		    strokeColor:    "black",
		    mode:           "WIRED"
	    });
    }

    /**
     * This method allow you to set the color of the current Shape.
     *
     * @method setFillColor
     * @param {String} color this parameter represent the color to assign to the fill mode.
     *  For example if you want to set it black, you should do `myShape.setFillColor("black");`
     */
    Shape.prototype.setFillColor = function(color) {
        this.color = color;
    };

    /**
     * This method allow you to change the draw mode of the current shape.
     * Two modes are available "WIRED" and "FILLED".
     *
     * @method setMode
     * @param {String} type this parameter represent the draw style. type can be set to "WIRED" or "FILLED".
     */
    Shape.prototype.setMode = function(type) {
        if (type === "WIRED" || type === "FILLED") {
            this.mode = type;
            return true;
        } else {
            return false;
        }
    };

    /**
     * This method allow you to set the stroke color of the current shape.
     *
     * @method setStrokeColor
     * @param {String} color this parameter represent the color to apply to the stroke mode.
     *  For example to set the stroke color to black you should used `myShape.setStrokeColor("black");`
     */
    Shape.prototype.setStrokeColor = function(color) {
        this.strokeColor = color;
    };

}(TW));

/**
 @module Graphic
 @namespace Graphic
 */

var TW = TW || {};

(function(TW) {

    TW.Graphic = TW.Graphic ||  {};
    TW.Graphic.Circle = Circle;

    if (typeof window.define === "function" && window.define.amd) {
        define('graphic/Circle',['./Shape', '../utils/Inheritance'], function() {
            TW.Utils.inherit(Circle, TW.Graphic.Shape);
            return Circle;
        });
    } else {
        TW.Utils.inherit(Circle, TW.Graphic.Shape);
    }

    /**
     * This class extends the Shape class. When you create a Circle object
     * like `var myCircle = new TW.Graphic.Circle();`
     * the default radius of the object is 50pixels.
     *
     * @class Circle
     * @extends Shape
     * @constructor
     * @param {Object} [params] set of properties given to Circle.
     *   *params* is given to {{#crossLink "Graphic.Shape"}}{{/crossLink}} constructor.
     *   @param {Number} [params.radius=50] radius of the circle.
     */
    function Circle(params) {
        TW.Graphic.Shape.call(this, params);
	    TW.Graphic.GraphicObject.call(this, params);
	    TW.Utils.copyParam(this, params, {
		    radius:          50
	    });
    }



    /**
     * This overridden draw method allow the Circle class to draw a circle on the context given in parameter.
     *
     * @method draw
     * @param context if the context object is not a valid object the method will returns false, otherwise it
     * will returns true.
     */
    Circle.prototype.draw = function(context) {
        if (context) {
            //TODO apply the matrix transformations on the context before drawing the circle
            context.save();
            context.translate(this.x, this.y);
            this.matrix.transformContext(context);
            context.translate(-this.xCenterPoint, -this.yCenterPoint);
            context.beginPath();
            context.arc(0, 0, this.radius, Math.PI * 2, 0, true);
            if (this.mode === "WIRED") {
                context.strokeStyle = this.strokeColor;
                context.stroke();
            } else {
                context.fillStyle = this.color;
                context.fill();
            }
            context.closePath();
            context.restore();
            return true;
        } else {
            return false;
        }
    };

}(TW));
/**
 @module Graphic
 @namespace Graphic
 */

var TW = TW || {};

(function(TW) {

    TW.Graphic = TW.Graphic ||  {};
    TW.Graphic.Rect = Rect;

    if (typeof window.define === "function" && window.define.amd) {
        define('graphic/Rect',['./Shape', '../utils/Inheritance'], function() {
            TW.Utils.inherit(Rect, TW.Graphic.Shape);
            return Rect;
        });
    } else {
        TW.Utils.inherit(Rect, TW.Graphic.Shape);
    }

	/**
	 * @class Rect
	 * @extends Shape
	 * @param {Object} [params]
	 *   *params* is given to {{#crossLink "Graphic.Shape"}}{{/crossLink}} constructor.
	 * @constructor
	 */
    function Rect(params) {
        TW.Graphic.Shape.call(this, params);
    }

    Rect.prototype.draw = function(context) {
        if (context) {
            //TODO apply the matrix transformations on the context before drawing the circle
            context.save();
            context.translate(this.x, this.y);
            this.matrix.transformContext(context);
            context.translate(-this.xCenterPoint, -this.yCenterPoint);
            if (this.mode === "WIRED") {
                context.strokeStyle = this.strokeColor;
                context.strokeRect(0, 0, this.width, this.height);
            } else {
                context.fillStyle = this.color;
                context.fillRect(0, 0, this.width, this.height);
            }
            context.restore();
            return true;
        } else {
            return false;
        }
    };

})(TW);
/**
 @module Graphic
 @namespace Graphic
 */

var TW = TW || {};

(function(TW) {

    TW.Graphic = TW.Graphic ||  {};
    TW.Graphic.Sprite = Sprite;

    if (typeof window.define === "function" && window.define.amd) {
        define('graphic/Sprite',['./GraphicObject', '../utils/Inheritance'], function() {
            TW.Utils.inherit(Sprite, TW.Graphic.GraphicObject);
            return Sprite;
        });
    } else {
        TW.Utils.inherit(Sprite, TW.Graphic.GraphicObject);
    }

    /**
     * The Sprite class provide methods to draw sprites on a context. the aim of the sprites object is to be added
     * to a Layer or to be use directly with a graphical context by invoking the draw method of the Sprite.
     *
     * @example
     *
     *      var mySprite = new TW.Graphic.Sprite();
     *      mySprite.draw(canvasContext);
     *
     * @class Sprite
     * @extends GraphicObject
     * @param {Object} [params]
     *  *params* is given to {{#crossLink "Graphic.GraphicObject"}}{{/crossLink}} constructor.
     *  @param {Object} [params.image]
     *  @param {Object} [params.imageRect]
     * @constructor
     */
    function Sprite(params) {
	    TW.Graphic.GraphicObject.call(this, params);
	    TW.Utils.copyParam(this, params, {
		    image:      null,
		    imageRect:  null
	    });
    }



    /**
     * This method allow you to set the image of the Sprite. the image object must be a valid object otherwise the
     * behavior of the setImage method is unspecified.
     *
     * @method setImage
     * @param image this object must be a valid image object
     * @param obj this parameter is optional. If you specify it you can used just a subImage of the current image to
     * use. It is useful for the spritesheets for example where you only want to draw a specific area of the image.
     * @return {Boolean} this method returns true if the image parameter is a valid object, otherwise it will
     * returns false.
     */
    Sprite.prototype.setImage = function(image, obj) {
        if (image) {
            this.image = image;
            if (obj && obj.x && obj.y && obj.w && obj.h) {
                this.imageRect = obj;
            } else {
                this.imageRect = null;
            }
            this.notifyParentChange();
            return true;
        }	else {
            return false;
        }
    };

    /**
     * This method allow you to draw the sprite on a context.
     *
     * @method draw
     * @param context this parameter must be a valid canvas context,
     *  otherwise the behavior of the draw method is unspecified.
     * @return {Boolean} this methods return true if the context parameter is a valid object and if the sprite's
     * image is also a valid object.
     */
    Sprite.prototype.draw = function(context) {
        if (context && this.image) {
            context.save();
            context.translate(this.x, this.y);
            this.matrix.transformContext(context);
            context.translate(-this.xCenterPoint, -this.yCenterPoint);
            //TODO do transformation from the GraphicObject matrix.
            if (this.imageRect === null) {
                context.drawImage(this.image, 0, 0, this.width, this.height);
            } else {
                context.drawImage(this.image, this.imageRect.x, this.imageRect.y,
                    this.imageRect.w, this.imageRect.h, 0, 0,
                    this.width, this.height);
            }
            context.restore();
            return true;
        } else {
            return false;
        }
    };

}(TW));
/**
 @module Graphic
 @namespace SpriteSheet
 */

var TW = TW || {};

(function(TW) {

    TW.Graphic = TW.Graphic ||  {};
    TW.Graphic.SpriteSheet = SpriteSheet;

	if (typeof window.define === "function" && window.define.amd) {
		define('graphic/SpriteSheet',['../utils/Inheritance'], function() {
            return SpriteSheet;
        });
    }

    /**
     * The spritesheet class provides a model to describe animations from an image called spriteSheet.
     *
     * @class SpriteSheet
     * @constructor
     * @param {Image} image represents the image on which the SpriteSheet coordinate will be applied.
     * @param {Object} config represents the object which provides the description of each animation.
     *
     *
     *      var mySpriteSheet = new SpriteSheet(image, config);
     *
     *  config object represents the raw configuration of the spriteSheet.
     *  Please see below the synthax of a spriteSheet :
     *
     *  The SpriteSheet in tumbleweed work on JSON objects.
     *  Inside of these JSON objects, there is a description of all or just one animation.
     *  In the previous example, config is a full description of the animation.
     *  Here is how tumbleweed's spritesheets are configured :
     *
     *  First of all let's define the structure of our SpriteSheet object :
     *
     *      {}
     *
     *  As you can see it is only an empty JSON object.
     *  This object can handle some informations about the animation.
     *
     *  **Setting default values.**
     *
     *      default : {}
     *
     *  The default object can handle default values. It is useful to make some constants in the spriteSheet.
     *  For example if you want to define 5 constants (x = 10, y = 30, w = 50, h = 60, framerate = 25) You must
     *  proceed like this :
     *
     *      default : {x : 10,
     *             y : 30,
     *             w : 50,
     *             h : 60,
     *             framerate : 25}
     *
     *
     *  **Setting animations.**
     *  Each animation is composed by frames and can also define a framerate value which override the framerate
     *  from default values.
     *  Here is an important tip, in some animations you may don't want to use the default values. Then you just
     *  Have to redefine them inside of the animation.
     *  To create an animation named 'walk' which have framerate set to 12 you must proceed like this :
     *
     *      walk : {
     *          framerate: 12,
     *          frames : []
     *          }
     *
     *  Note that there is an entry in you walk animation called frames. This entry must contain each frame of the
     *  walk animation.
     *
     *  **Setting frames.**
     *  Each animation contain some frames. It works like a flipbook, each frame are displayed one
     *  after another, tumbleweed will wait 1/framerate seconds to display the next frame.
     *  Let's imagine that your walk animation is made of three frames inside of your SpriteSheet.
     *  The first one will have the coordinate : x = 0, y = 0, w = 50, h = 50
     *  The second one will have the coordinate : x = 50, y = 0, w = 50, h = 50
     *  And finally the third one will have the coordinate : x = 0, y = 50, w = 50, h = 50
     *
     *  Let's see below what will be the result of these frame inside of our walk animation object :
     *
     *      walk : {
     *          framerate: 12,
     *          frames : [{x:0, y:0, w: 50, h: 50},
     *                    {x:50, y:0, w:50, h:50},
     *                   {x:0, y:50, w:50, h:50}]
     *          }
     *
     * Let's wrap it inside of our config object :
     *
     *     var config = {
     *     default: {
     *      x: 0,
     *      y: 0,
     *      w: 50,
     *      h: 50,
     *      framerate: 25
     *     },
     *     walk: {
     *          framerate: 12,
     *          frames: [{x:0, y:0, w: 50, h: 50},
     *                    {x:50, y:0, w:50, h:50},
     *                   {x:0, y:50, w:50, h:50}]
     *     }
     *     };
     *
     * Now you have a walk animation which contain 3 frames which will be displayed with a framerate of 12.
     * You have the basics to build your own animations.
     * In the following parts i will describe how to make animation's reference and how you can do
     * transformations on them.
     *
     * **Animation's reference**
     * Sometimes you can need to specify another animation which is a copy of another animation but with some
     * transformations on it, the typical case will be an animation of walking to right and another animation which
     * is walking to left.
     * Frames are the same except that they must be reverted horizontally.
     * To make it we will introduce a new entity which is the flip flags.
     * Flip flags allow you to flip images from an animation. You can either flip them by the x axis
     * (horizontal flip) or by the y axis (vertical flip).
     *
     * to illustrate it we will improve our config object which contain the walk animation.
     * Now we want 2 walk animation (walk_left and walk_right).
     * Initially we will consider that our previous definition of the walk animation was equivalent to the
     * walk_left animation.
     *
     * Now let's see now how looks like our config object :
     *
     *     var config = {
     *     default: {
     *     x: 0,
     *     y: 0,
     *     w: 50,
     *     h: 50,
     *     framerate: 25
     *     },
     *     walk_left: {
     *          framerate: 12,
     *          frames: [{x:0, y:0, w: 50, h: 50},
     *                    {x:50, y:0, w:50, h:50},
     *                   {x:0, y:50, w:50, h:50}]
     *     },
     *     walk_right: {                                  //This is our new animation entry : walk_right
     *          framerate: 12,                          //The framerate is the same than walk_left
     *          frames: [{x:0, y:0, w:50, h:50},        //The frames are also the same than walk_left
     *                   {x:50, y:0, w:50, h:50},
     *                   {x:0, y:50, w:50, h:50}],
     *          flip_x: true,                           //Flip_x true indicate that all the frames must be
     *                                                  //horizontally flipped before being draw.
     *     }
     *     };
     *
     * There's one annoying thing in the previous definition, as you can see, the frames of the walk_left animation
     * and the frames of the walk_right animation are duplicated. There's one way to solve this problem. the alias flag.
     *
     * **alias flag.**
     * Alias flag allows you to define an animation by referencing another, it's quite useful when an animation has
     * the same frames than another. And we're actually in this case.
     * Using the alias flag, this is what will be your config object :
     *
     *     var config = {
     *     default: {
     *       x: 0,
     *       y: 0,
     *       w: 50,
     *       h: 50,
     *       framerate: 25
     *     },
     *     walk_left: {
     *          framerate: 12,
     *          frames: [{x:0, y:0, w: 50, h: 50},
     *                    {x:50, y:0, w:50, h:50},
     *                   {x:0, y:50, w:50, h:50}]
     *     },
     *     walk_right: {              //This is our new animation entry : walk_right
     *          framerate: 12,      //The framerate is the same than walk_left
     *          alias: "walk_left", //by declaring walk_left as alias, walk_right will share it's frames with walk_left.
     *          flip_x: true,       //Flip_x true indicate that all the frames must be
     *                              //horizontally flipped before being draw.
     *     }
     *     };
     *
     *  There's one new thing, now we want to add some frames which are a copy of the previous frame.
     *  It can be useful in some case. For example if you want to wait more than one cycle to go on the next frame.
     *  In this case you have to use the nb_frames flag. It works like a duplicator, if nb_frames equal 5 then it
     *  will create 5 frames from the current frame (including the current frame). Let's duplicate 5 times the last
     *  frame of walk_left animation.
     *
     *     var config = {
     *     default: {
     *     x: 0,
     *     y: 0,
     *     w: 50,
     *     h: 50,
     *     framerate: 25
     *     },
     *     walk_left: {
     *          framerate: 12,
     *          frames: [{x:0, y:0, w: 50, h: 50},
     *                    {x:50, y:0, w:50, h:50},
     *                   {x:0, y:50, w:50, h:50, nb_frames: 5}] //Now our last frame will be duplicated 5 times.
     *     },
     *     walk_right: {
     *          framerate: 12,
     *          alias: "walk_left",
     *          flip_x: true
     *     }
     *     };
     *
     *  Now let me introduce you the last feature which allows you to reverse the frames order of an animation.
     *  There's some case where you will need to reverse the frames of an animation, especially when you animation
     *  is an alias of another.
     *  Let's took our previous example, now, i want to add two moonwalk animation (moonwalk_left, moonwalk_right).
     *  To make them i will apply to them respectively an alias of the walk_left and walk_right, and then, i will apply
     *  to moonwalk_right and moonwalk_right the reverse flag which will reverse the frames that the animation contains.
     *
     *     var config = {
     *     default: {
     *     x: 0,
     *     y: 0,
     *     w: 50,
     *     h: 50,
     *     framerate: 25
     *     },
     *     walk_left: {
     *          framerate: 12,
     *          frames: [{x:0, y:0, w: 50, h: 50},
     *                    {x:50, y:0, w:50, h:50},
     *                   {x:0, y:50, w:50, h:50, nb_frames: 5}] //Now our last frame will be duplicated 5 times.
     *     },
     *     walk_right: {
     *          framerate: 12,
     *          alias: "walk_left",
     *          flip_x: true
     *     }
     *     moonwalk_left: {
     *          framerate: 12,
     *          alias: "walk_right",
     *          reverse: true           //We set our moonwalk_left animation to be reversed.
     *     },
     *     moonwalk_right: {
     *          framerate: 12,
     *          alias: "walk_left",
     *          reverse: true           //We set out moonwalk_right animation to be reversed.
     *    }
     *    };
     *
     */
    function SpriteSheet(image, config) {
        this.listAnimation = {};
        this.image = image;
        this.config = TW.Utils.clone(config);
        for (var a in this.config) {
            if (a !== "default") {
                if (this.config[a].alias) {
                    if (this.listAnimation[this.config[a].alias]) {
                        this.config[a].frames = TW.Utils.clone(this.listAnimation[this.config[a].alias].frames);
                    }
                }
                this.developAnimationFrames(this.config[a]);
                if (this.config[a].reverse && this.config[a].reverse === true) {
                    this.config[a].frames.reverse();
                }
            }
            this.listAnimation[a] = this.config[a];
        }
    }

    /**
     * This function is used internally by the SpriteSheet class to apply the default values in the frames.
     * @method applyDefaultValuesToFrames
     * @param {Object} animation object which contains the description of the animation to apply default values.
     * @private
     */
    SpriteSheet.prototype.applyDefaultValuesToFrames = function(animation) {
        if (!this.config['default']) {
            return;
        }
        if (this.config['default'].framerate) {
            if (!animation.framerate) {
                animation.framerate = this.config['default'].framerate;
            }
        }
        if (this.config['default'].flip_x) {
            if (!animation.flip_x) {
                animation.flip_x = this.config['default'].flip_x;
            }
        }
        if (this.config['default'].flip_y) {
            if (!animation.flip_y) {
                animation.flip_y = this.config['default'].flip_y;
            }
        }
        if (this.config['default'].reverse) {
            if (!animation.reverse) {
                animation.reverse = this.config['default'].reverse;
            }
        }
        if (!animation.frames) {
            return;
        }
        for (var i = 0; i < animation.frames.length; i++) {
            if (this.config['default'].x) {
                if (!animation.frames[i].x) {
                    animation.frames[i].x = this.config['default'].x;
                }
            }
            if (this.config['default'].y) {
                if (!animation.frames[i].y) {
                    animation.frames[i].y = this.config['default'].y;
                }
            }
            if (this.config['default'].w) {
                if (!animation.frames[i].w) {
                    animation.frames[i].w = this.config['default'].w;
                }
            }
            if (this.config['default'].h) {
                if (!animation.frames[i].h) {
                    animation.frames[i].h = this.config['default'].h;
                }
            }
            if (this.config['default'].nb_frames) {
                if (!animation.frames[i].nb_frames) {
                    animation.frames[i].nb_frames = this.config['default'].nb_frames;
                }
            }
        }
    };

	/**
	 * This function is private and have the aim to autoincrement each frame duplicated in order to generate animation.
	 * @param {Object} frame frame which will be transformed
	 * @method _applyFrameIncrementation
	 * @private
	 */
	SpriteSheet.prototype._applyFrameIncrementation = function(frame) {
		if (!frame.way) {
			return;
		}
		switch (frame.way) {
			case "LEFT" :
				frame.x -= frame.w;
				if (frame.x  < 0) {
					frame.x = this.image.width - frame.w;
					frame.y += frame.h;
				}
				break;
			case "RIGHT" :
				frame.x += frame.w;
				if (frame.x + frame.w > this.image.width) {
					frame.x = 0;
					frame.y += frame.h;
				}
				break;
			case "UP" :
				frame.y -= frame.h;
				if (frame.y < 0) {
					frame.x += frame.w;
					frame.y = this.image.height - frame.h;
				}
				break;
			case "DOWN" :
				frame.y += frame.h;
				if (frame.y + frame.h > this.image.height) {
					frame.x += frame.w;
					frame.y = 0;
				}
				break;
		}
		//delete frame.way;
	};

	SpriteSheet.prototype._setLitteralHotPoint = function(frame, stringHotpoint) {
		var x_hot_point;
		var y_hot_point;

		switch (stringHotpoint) {
			case "LEFT-TOP":
				x_hot_point = 0;
				y_hot_point = 0;
				break;
			case "CENTER-TOP":
				x_hot_point = frame.w / 2;
				y_hot_point = 0;
				break;
			case "RIGHT-TOP":
				x_hot_point = frame.w;
				y_hot_point = 0;
				break;
			case "LEFT-CENTER":
				x_hot_point = 0;
				y_hot_point = frame.h / 2;
				break;
			case "CENTER-CENTER":
				x_hot_point = frame.w / 2;
				y_hot_point = frame.h / 2;
				break;
			case "RIGHT-CENTER":
				x_hot_point = frame.w;
				y_hot_point = frame.h / 2;
				break;
			case "LEFT-BOTTOM":
				x_hot_point = 0;
				y_hot_point = frame.h;
				break;
			case "CENTER-BOTTOM":
				x_hot_point = frame.w / 2;
				y_hot_point = frame.h;
				break;
			case "RIGHT-BOTTOM":
				x_hot_point = frame.w;
				y_hot_point = frame.h;
				break;
		}
		frame.hotpoint = {x:x_hot_point, y:y_hot_point};
	};

	/**
	 * The _applyHotPoint is private and set some parameters about the hot points.
	 * @method _applyHotPoint
	 * @param frames
	 * @private
	 */
	SpriteSheet.prototype._applyHotPoint = function(animation_entry, frames) {
		var x_hot_point;
		var y_hot_point;

		if (animation_entry.hotpoint) {
			for (var i = 0; i < frames.length; i++) {
				if (typeof animation_entry.hotpoint === "string") {
					this._setLitteralHotPoint(frames[i], animation_entry.hotpoint);
				} else {
					if (!animation_entry.hotpoint.x || !animation_entry.hotpoint.y ||
					    isNaN(animation_entry.hotpoint.x) || isNaN(animation_entry.hotpoint.y)) {
						return;
					}
					x_hot_point = animation_entry.hotpoint.x;
					y_hot_point = animation_entry.hotpoint.y;
					frames[i].hotpoint = {x: x_hot_point, y: y_hot_point};
				}
			}
		}
	};

    /**
     * This function is private and have the aim to clone an animation entry.
     * @private
     * @method developAnimationFrames
     * @param {Object} animationEntry
     */
    SpriteSheet.prototype.developAnimationFrames = function(animationEntry) {
        var newFrames = [];
        var offset = 0;
	    var frame_clone;

        this.applyDefaultValuesToFrames(animationEntry);
        if (!animationEntry.frames) {
            return;
        }
        for (var i = 0; i < animationEntry.frames.length; i++) {
            if (animationEntry.frames[i].nb_frames && animationEntry.frames[i].nb_frames >= 1) {
                for (var j = 0; j < animationEntry.frames[i].nb_frames; j++) {
	                if (j === 0) {
	                 frame_clone = TW.Utils.clone(animationEntry.frames[i]);
	                } else {
		             frame_clone = TW.Utils.clone(newFrames[offset - 1]);
	                }
	                if (j > 0) {
	                 this._applyFrameIncrementation(frame_clone);
	                }
                    newFrames.push(frame_clone);
                    delete newFrames[offset].nb_frames;
                    offset++;
                }
            } else {
                newFrames.push(TW.Utils.clone(animationEntry.frames[i]));
            }
        }
	    this._applyHotPoint(animationEntry, newFrames);
        animationEntry.frames = newFrames;
    };

    /**
     * addAnimation method allows you to add an animation to the current SpriteSheet object.
     * Note that if you add an animation with the same name than a previous one, the older will be overwritted.
     *
     * @method addAnimation
     * @param {String} name it is the name of the animation
     * @param {Object} config it is an object which contains the description of the name animation.
     * @return {Boolean} this method returns true if the animation have successfully been added to the SpriteSheet
     * object otherwise it will returns false
     */
    SpriteSheet.prototype.addAnimation = function(name, config) {
        this.config[name] = TW.Utils.clone(config);
        if (this.config[name].alias) {
            if (this.listAnimation[this.config[name].alias]) {
                this.config[name].frames = TW.Utils.clone(this.listAnimation[this.config[name].alias].frames);
            }
        }
        this.developAnimationFrames(this.config[name]);
        this.listAnimation[name] = this.config[name];
    };

    /**
     * rmAnimation method allows you to suppress an animation from the current SpriteSheet object.
     *
     * @method rmAnimation
     * @param {String} name it is the name of the animation to delete
     * @return {Boolean} the rmAnimation returns true if the name animation have been successfuly suppressed
     * from the current SpriteSheet object.
     */
    SpriteSheet.prototype.rmAnimation = function(name) {
        if (this.config[name] && this.listAnimation[name]) {
            delete this.config[name];
            delete this.listAnimation[name];
            return true;
        } else {
            return false;
        }
    };

    /**
     * getAnimation method allows you to get a description of the name animation.
     *
     * @method getAnimation
     * @param {String} name it is the name of the animation which you want to get the description
     * @return {Object} the getAnimation method returns the description of the name animation on success.
     * Otherwise it returns null
     */
    SpriteSheet.prototype.getAnimation = function(name) {
        if (this.config[name]) {
            return TW.Utils.clone(this.config[name]);
        } else {
            return null;
        }
    };


    /**
     * setAnimation method allows you to set a new animation inside of the current SpriteSheet object.
     *
     * @method setAnimation
     * @param {String} name it is the name of the new animation to be set.
     * @param {Object} config it is the config object which describe the name animation.
     * @return {Boolean} the setAnimation method returns true if the new animation have been successfully added to
     * the current SpriteSheet object. Otherwise it returns false.
     */
    SpriteSheet.prototype.setAnimation = function(name, config) {
        this.addAnimation(name, config);
        return true;
    };

    /**
     * getListAnim method allows you to get the list of the animation contained inside of the
     * current SpriteSheet object.
     *
     * @method getListAnim
     * @return {Object} returns an object containing the animations of the SpriteSheet object.
     */
    SpriteSheet.prototype.getListAnimation = function() {
        return this.config;
    };

    /**
     * getImage method allows you to get the current image used by the current SpriteSheet object.
     *
     * @method getImage
     * @return {Image} returns the current image used by the current SpriteSheet object.
     */
    SpriteSheet.prototype.getImage = function() {
        return this.image;
    };

    /**
     * setImage method allows you to set the current image used by the current SpriteSheet object.
     *
     * @method setImage
     * @param {Image} image represents the image on which the SpriteSheet coordinates will be applies.
     */
    SpriteSheet.prototype.setImage = function(image) {
        this.image = image;
    };

}(TW));
/**
 @module Graphic
 @namespace Graphic
 */

var TW = TW || {};

(function(TW) {

    TW.Graphic = TW.Graphic ||  {};
    TW.Graphic.AnimatedSprite = AnimatedSprite;

    if (typeof window.define === "function" && window.define.amd) {
		define('graphic/AnimatedSprite',['./Sprite', '../utils/Inheritance'], function() {
            TW.Utils.inherit(AnimatedSprite, TW.Graphic.Sprite);
            return AnimatedSprite;
        });
    } else {
        TW.Utils.inherit(AnimatedSprite, TW.Graphic.Sprite);
    }

    /**
     * The AnimatedSprite allows you to create an object which can be animated using a SpriteSheet.
     * When you instanciate a new AnimatedSprite instance, you have to pass it the SpriteSheet which it will
     * have to use.
     * @class AnimatedSprite
     * @constructor
     * @param {Object} params
     *   *params* is given to {{#crossLink "Graphic.Sprite"}}{{/crossLink}} constructor.
     *   @param {SpriteSheet} params.spriteSheet it is a SpriteSheet object which contains one or severals animation
     *   which can be used by the current AnimatedSprite object.
     */
    function AnimatedSprite(params) {
        TW.Graphic.Sprite.call(this, params);
        this.image = params.spriteSheet ? params.spriteSheet : null;
        this.currentAnim = "";
        this.currentFrame = 0;
        this.date = new Date();
        this.loop = false;
        this.timeStart = this.date.getTime();
        this.callback = null;
        this.status = "stop";
        this.sigma_elapsed_time = 0;
    }

    /**
     * The setSpriteSheet method allows you to set the current spriteSheet to use.
     * @method setSpriteSheet
     * @param {SpriteSheet} spriteSheet It represents the spriteSheet instance which will be attached on the current
     * AnimatedSprite object.
     */
    AnimatedSprite.prototype.setSpriteSheet = function(spriteSheet) {
        this.image = spriteSheet;
    };

    /**
     * The getSpriteSheet method allows you to get the current spriteSheet object which is currently
     * attached to the AnimatedSprite.
     * @method getSpriteSheet
     * @return {SpriteSheet} the getSpriteSheet method returns the current SpriteSheet in use otherwise it returns null.
     */
    AnimatedSprite.prototype.getSpriteSheet = function() {
        return this.image;
    };

    /**
     * the play method allows you to start an animation (note that this animation must be defined inside of the
     * SpriteSheet object currently used by the AnimatedSprite).
     * @method play
     * @param {String} name string parameter which represents the name of the animation to start
     * @param {Boolean} loop boolean parameter which set looping the animation if set to true.
     * Otherwise, looping is disabled.
     * @param {Function} callback function which is called each time the animation reach it's end.
     * Callback take one parameter which is an object which contains the following parameters :
     * @param {Boolean} callback.loop a boolean which represent the loop status of the animation,
     * if loop true then the animation will loop when its reach its end.
     * @param {String} callback.anim a string which represent the name of the animation which reach end.
     * @param {AnimatedSprite} callback.sprite a reference to the animated sprite which called the callback
     * @param {String} callback.status a string which represent the status of the callback,
     * status can have the following values :
     *
     * - `"END:LOOP"` the AnimatedSprite will loop
     * - `"END:STOP"` the AnimatedSprite is now stopped,
     * - `"PAUSE"` the AnimatedSprite is now paused
     * - `"RESUME"` the animated sprite is now resumed
     *
     * @return {Boolean} if the animation have been finded and will be played the return value will be true,
     * otherwise it will be false.
     */
    AnimatedSprite.prototype.play = function(name, loop, callback) {
        this.currentAnim = name;
        this.loop = loop;
		this.currentFrame = 0;
        this.callback = callback;
        this.status = "play";
    };

    /**
     * The pause method allows you to pause the current animation until the resume method is called.
     * @method pause
     * @return {Boolean} if the pause method has been successfully called, then the return value will be true,
     * otherwise it will be false.
     */
    AnimatedSprite.prototype.pause = function() {
        this.status = "pause";
        if (this.callback && typeof this.callback === "function") {
            this.callback({loop: this.loop, anim: this.currentAnim, sprite: this, status: "PAUSE"});
        }
    };

    /**
     * The resume method allows you to resume the current animation if it has been pause before.
     * @method resume
     * @return {Boolean} return true if the resume method has been successfully called, otherwise it returns false.
     */
    AnimatedSprite.prototype.resume = function() {
        this.status = "play";
        if (this.callback && typeof this.callback === "function") {
            this.callback({loop: this.loop, anim: this.currentAnim, sprite: this, status: "RESUME"});
        }
    };

    /**
     * The stop method allows you to stop and then rewind the current animation.
     * @method stop
     * @return {Boolean} returns true if the stop method has been successfully called. Otherwise false is returned.
     */
    AnimatedSprite.prototype.stop = function() {
        this.status = "stop";
        //this.currentAnim = "";
        this.callback = null;
        this.currentFrame = 0;
        if (this.callback && typeof this.callback === "function") {
            this.callback({loop: this.loop, anim: this.currentAnim, sprite: this, status: "END:STOP"});
        }
		this.notifyParentChange();
    };

    /**
     * The isPlaying method allows you to test if the current AnimatedSprite object is playing or not an animation.
     * @method isPlaying
     * @return {Boolean} returns true if the current AnimatedSprite object is playing an animation,
     * otherwise it returns false.
     */
    AnimatedSprite.prototype.isPlaying = function() {
        if (this.status === "play") {
            return true;
        } else {
            return false;
        }
    };

    /**
     * The getCurrentAnim returns the current animation which is currently played.
     * @method getCurrentAnim
     * @return {Object} returns the animation which is played. If there is no animations currently played then the
     * getCurrentAnim method will returns null.
     */
    AnimatedSprite.prototype.getCurrentAnim = function() {
        if (this.image && this.image !== null) {
            if (this.currentAnim !== "") {
                return this.image.getAnimation(this.currentAnim);
            }
        }
        return null;
    };

    /**
     * The update method is called each frame by the gameloop.
     * @method update
     * @return {Boolean} return true if the update function has been called successfully,
     * otherwise false is returned.
     */
    AnimatedSprite.prototype.update = function(delta_time) {
        this.sigma_elapsed_time += delta_time;
        if (this.image === null || this.currentAnim === "") {
            return false;
        }
        var current_anim = this.image.getAnimation(this.currentAnim);
        if (!current_anim.frames || !current_anim.framerate) {
            return false;
        }
        if (this.isPlaying()) {
            if (this.sigma_elapsed_time >= 1000/current_anim.framerate) {
                this.currentFrame++;
                if (this.currentFrame >= current_anim.frames.length) {
                    if (this.loop === true) {
                        this.currentFrame = 0;
                        this.notifyParentChange();
                    } else {
                        this.stop();
                    }
                    if (this.callback && typeof this.callback === "function") {
                        this.callback({loop: this.loop, anim: this.currentAnim, sprite: this, status: "END:LOOP"});
                    }
                } else {
                    this.notifyParentChange();
                }
            this.timeStart = this.date.getTime();
            this.sigma_elapsed_time = 0;
            }
        }
      return true;
    };

	/**
	 * This method is private and associate to the animated sprite the hotpoint
	 * @method _setCenterPointByHotPoint
	 * @param {Object} current_anim current animation of the Animated Sprite.
	 * @private
	 */
	AnimatedSprite.prototype._setCenterPointByHotPoint = function(current_anim) {
		if (current_anim.frames[this.currentFrame].hotpoint) {
			this.xCenterPoint = current_anim.frames[this.currentFrame].hotpoint.x;
			this.yCenterPoint = current_anim.frames[this.currentFrame].hotpoint.y;
		}
	};

    /**
     * This method allow you to draw an animated sprite on a context.
     *
     * @method draw
     * @param context this parameter must be a valid canvas context,
     *  otherwise the behavior of the draw method is unspecified.
     * @return {Boolean} this methods return true if the context parameter is a valid object and if the sprite's
     * image is also a validSpriteSheet.
     */
    AnimatedSprite.prototype.draw = function(context) {
        if (this.image === null || this.currentAnim === "") {
            return false;
        }
        var current_anim = this.image.getAnimation(this.currentAnim);
        if (!current_anim.frames || !current_anim.framerate) {
            return false;
        }
        if (context && this.image) {
            context.save();
            context.translate(this.x, this.y);
            this.matrix.transformContext(context);
	        this._setCenterPointByHotPoint(current_anim);
            context.translate(-this.xCenterPoint, -this.yCenterPoint);
            if (current_anim.flip_x) {
                context.scale(-1, 1);
                context.translate(-this.width, 0);
            }
            if (current_anim.flip_y) {
                context.scale(1, -1);
                context.translate(0, -this.height);
            }
            //TODO do transformation from the GraphicObject matrix.
            context.drawImage(this.image.getImage(),
                current_anim.frames[this.currentFrame].x,
                current_anim.frames[this.currentFrame].y,
                current_anim.frames[this.currentFrame].w,
                current_anim.frames[this.currentFrame].h,
                0, 0, this.width, this.height);
            context.restore();
            return true;
        } else {
            return false;
        }
    };

})(TW);

/**
 * The graphic module contains a set of classes
 * extending HTML 2D canvas API.
 * It include matrix manipulation, graphic scope management, graphic cache and tools for improve performances.
 *
 * ### drawable objects
 *
 * All drawable object inherit from {{#crossLink "Graphic.GraphicObject"}}{{/crossLink}}.
 * This class contain some methods for manipulate Matrix and set general graphic properties.
 *
 * Tumbleweed provide two object categories: {{#crossLink "Graphic.Shape"}}{{/crossLink}} and
 * {{#crossLink "Graphic.Sprite"}}{{/crossLink}}.<br />
 * Sprites are used for draw an image or a part of image.<br />
 * Shapes are dedicated to rendering forms like rectangles or Circles.
 *
 * ### graphic scope & matrix transformation
 *
 * Although it's possible to draw a GraphicObject directly by passing a canvas context, the most easy way is to
 * use {{#crossLink "Graphic.Window"}}{{/crossLink}} and {{#crossLink "Graphic.Layer"}}{{/crossLink}}.<br />
 * A layer is a graphicalObject which can contain others graphical objects.
 * The interest is to add matrix transformations and share them to many objects.<br />
 * `Window` is a special layer keeping a reference from a HTML Canvas Element.
 *
 *
 * ### performance
 *
 * For improve graphic performances, two way are possible: draw less objects each time or draw less often.
 * The graphic module contain methods for reduce both number of redraw and useless draw.<br />
 * The first point is treated by the cache management, provided by {{#crossLink "Graphic.Layer"}}{{/crossLink}}
 * and {{#crossLink "Graphic.Window"}}{{/crossLink}} classes. After a first draw, a canvas cache is kept in memory
 * for don't redraw until object has changed.<br />
 *
 * The second point is the purpose of the class {{#crossLink "Graphic.SpatialContainer"}}{{/crossLink}},
 * used by {{#crossLink "Graphic.Layer"}}{{/crossLink}}
 * and {{#crossLink "Graphic.Window"}}{{/crossLink}}.
 *
 * Each SpatialContainer check for draw only a part of all objects, and not try to draw objects
 * which are not in the screen.
 * Because different type of scenes exist, each container is adapted to specific context.
 *
 * @module Graphic
 * @main
 */


var TW = TW || {};

if (typeof window.define === "function" && window.define.amd) {

    define('graphic',[
        './graphic/Camera',
        './graphic/Circle',
        './graphic/GraphicObject',
        './graphic/Layer',
        './graphic/Rect',
        './graphic/Shape',
        './graphic/SpatialContainer',
        './graphic/Sprite',
        './graphic/Window',
        './graphic/SpriteSheet',
        './graphic/AnimatedSprite'
    ], function() {
        return TW.Graphic;
    });
}

;
/**
 * This module contain useful class and method
 * for perform calcul with matrix or vector.
 *
 * @module Math
 * @main
 */


var TW = TW || {};

if (typeof window.define === "function" && window.define.amd) {

    define('math',[
        './math/Matrix2D',
        './math/Vector2D'
    ], function() {
        return TW.Math;
    });

}

;
/**
 @module Preload
 @namespace Preload
 */

var TW = TW || {};

(function(TW) {

    TW.Preload = TW.Preload ||  {};
    TW.Preload.XMLHttpRequestLoader = XMLHttpRequestLoader;

    if (typeof window.define === "function" && window.define.amd) {
        define('preload/XMLHttpRequestLoader',['./Preload'], function() {
            return XMLHttpRequestLoader;
        });
    }

	/**
	 * @class XMLHttpRequestLoader
	 * @param file
	 * @constructor
	 */
	function XMLHttpRequestLoader(file) {
		/**
		 * Determine if this loader has completed already.
		 * @property loaded
		 * @type Boolean
		 * @default false
		 */
		this.loaded = false;

		/**
		 * The current load progress (percentage) for this item.
		 * @property progress
		 * @type Number
		 * @default 0
		 */
		this.progress = 0;

		// The manifest item we are loading
		this._item = file;

		//Callbacks
		/**
		 * The callback to fire when progress changes.
		 * @event onProgress
		 */
		this.onProgress = null;

		/**
		 * The callback to fire when a load starts.
		 * @event onLoadStart
		 */
		this.onLoadStart = null;

		/**
		 * The callback to fire when a file completes.
		 * @event onFileLoad
		 */
		this.onFileLoad = null;

		/**
		 * The callback to fire when a file progress changes.
		 * @event onFileProgress
		 */
		this.onFileProgress = null;

		/**
		 * The callback to fire when all loading is complete.
		 * @event onComplete
		 */
		this.onComplete = null;

		/**
		 * The callback to fire when the loader encounters an error. If the error was encountered
		 * by a file, the event will contain the required file data, but the target will be the loader.
		 * @event onError
		 */
		this.onError = null;

		this._createXHR(file);
	}

	/**
	 * Begin the load.
	 * @method load
	 */
	XMLHttpRequestLoader.prototype.load = function() {
		if (this._request === null) {
			this.handleError();
			return;
		}

		//Setup timeout if we're not using XHR2
		if (this._xhrLevel === 1) {
			this._loadTimeOutTimeout = setTimeout(this.handleTimeout.bind(this), TW.Preload.TIMEOUT_TIME);
		}

		//Events
		this._request.onloadstart = this.handleLoadStart.bind(this);
		this._request.onprogress = this.handleProgress.bind(this);
		this._request.onabort = this.handleAbort.bind(this);
		this._request.onerror = this.handleError.bind(this);
		this._request.ontimeout = this.handleTimeout.bind(this);

		//LM: Firefox does not get onload. Chrome gets both. Might need onload for other things.
		this._request.onload = this.handleLoad.bind(this);
		this._request.onreadystatechange = this.handleReadyStateChange.bind(this);

		try { // Sometimes we get back 404s immediately, particularly when there is a cross origin request.
			this._request.send();
		} catch (error) {
			this._sendError({source: error});
		}
	};
	/**
	 * Get a reference to the manifest item that is loaded by this loader.
	 * @method getItem
	 * @return {Object} The manifest item
	 */
	XMLHttpRequestLoader.prototype.getItem = function() {
		return this._item;
	};

	XMLHttpRequestLoader.prototype.getResult = function() {
		//[SB] When loading XML IE9 does not return .response, instead it returns responseXML.xml
		try {
			return this._request.responseText;
		} catch (error) {
		}
		return this._request.response;
	};

	/**
	 * Determine if a specific type should be loaded as a binary file
	 * @method isBinary
	 * @param type The type to check
	 * @private
	 */
	XMLHttpRequestLoader.prototype.isBinary = function(type) {
		switch (type) {
			case this.IMAGE:
			case this.SOUND:
				return true;
			default:
				return false;
		}
	};

	XMLHttpRequestLoader.prototype.handleProgress = function(event) {
		if (event.loaded > 0 && event.total === 0) {
			return; // Sometimes we get no "total", so just ignore the progress event.
		}
		this._sendProgress({loaded: event.loaded, total: event.total});
	};

	XMLHttpRequestLoader.prototype.handleLoadStart = function() {
		clearTimeout(this._loadTimeOutTimeout);
		this._sendLoadStart();
	};

	XMLHttpRequestLoader.prototype.handleAbort = function() {
		this._clean();
		this._sendError();
	};

	XMLHttpRequestLoader.prototype.handleError = function() {
		this._clean();
		this._sendError();
	};

	XMLHttpRequestLoader.prototype.handleReadyStateChange = function() {
		if (this._request.readyState === 4) {
			this.handleLoad();
		}
	};

	XMLHttpRequestLoader.prototype._checkError = function() {
		//LM: Probably need additional handlers here.
		var status = parseInt(this._request.status, 10);

		switch (status) {
			case 404:   // Not Found
			case 0:     // Not Loaded
				return false;
		}

		//wdg:: added check for this._hasTextResponse() ... Android  2.2 uses it.
		return this._hasResponse() || this._hasTextResponse() || this._hasXMLResponse();
	};

	/*
	 * Validate the response (we need to try/catch some of these, nicer to break them into functions.
	 */
	XMLHttpRequestLoader.prototype._hasResponse = function() {
		return this._request.response !== null;
	};

	XMLHttpRequestLoader.prototype._hasTextResponse = function() {
		try {
			return this._request.responseText !== null;
		} catch (e) {
			return false;
		}
	};

	XMLHttpRequestLoader.prototype._hasXMLResponse = function() {
		try {
			return this._request.responseXML !== null;
		} catch (e) {
			return false;
		}
	};

	XMLHttpRequestLoader.prototype.handleLoad = function(event) {
		if (this.loaded) {
			return;
		}
		this.loaded = true;

		if (!this._checkError()) {
			this.handleError();
			return;
		}

		this._clean();
		this._sendComplete();
	};

	XMLHttpRequestLoader.prototype.handleTimeout = function() {
		this._clean();
		this._sendError();
	};

	XMLHttpRequestLoader.prototype._createXHR = function(item) {
		this._xhrLevel = 1;

		if (window.ArrayBuffer) {
			this._xhrLevel = 2;
		}

		// Old IE versions use a different approach
		if (window.XMLHttpRequest) {
			this._request = new XMLHttpRequest();
		} else {
			try {
                /*global ActiveXObject */
				this._request = new ActiveXObject("MSXML2.XMLHTTXMLHttpRequestLoader.prototype.3.0");
			} catch (ex) {
				return null;
			}
		}

		//IE9 doesn't support .overrideMimeType(), so we need to check for it.
		if (item.type === TW.Preload.TEXT && this._request.overrideMimeType) {
			this._request.overrideMimeType('text/plain; charset=x-user-defined');
		}

		this._request.open('GET', item.src, true);

		if (this.isBinary(item.type)) {
			this._request.responseType = 'arraybuffer';
		}
		return true;
	};

	XMLHttpRequestLoader.prototype._clean = function() {
		clearTimeout(this._loadTimeOutTimeout);

		var req = this._request;
		req.onloadstart = null;
		req.onprogress = null;
		req.onabort = null;
		req.onerror = null;
		req.onload = null;
		req.ontimeout = null;
		req.onloadend = null;
		req.onreadystatechange = null;

		clearInterval(this._checkLoadInterval);
	};

	//Callback proxies
	XMLHttpRequestLoader.prototype._sendLoadStart = function(value) {
		if (this.onLoadStart) {
			this.onLoadStart({target: this});
		}
	};

	XMLHttpRequestLoader.prototype._sendProgress = function(value) {
		var event;
		if (value instanceof Number) {
			this.progress = value;
			event = {loaded: this.progress, total: 1};
		} else {
			event = value;
			this.progress = value.loaded / value.total;
			if (isNaN(this.progress) || this.progress === Infinity) {
				this.progress = 0;
			}
		}
		event.target = this;
		if (this.onProgress) {
			this.onProgress(event);
		}
	};

	XMLHttpRequestLoader.prototype._sendFileProgress = function(event) {
		if (this.onFileProgress) {
			event.target = this;
			this.onFileProgress(event);
		}
	};

	XMLHttpRequestLoader.prototype._sendComplete = function() {
		if (this.onComplete) {
			this.onComplete({target: this});
		}
	};

	XMLHttpRequestLoader.prototype._sendFileComplete = function(event) {
		if (this.onFileLoad) {
			event.target = this;
			this.onFileLoad(event);
		}
	};

	XMLHttpRequestLoader.prototype._sendError = function(event) {
		if (this.onError) {
			if (event === null) {
				event = {};
			}
			event.target = this;
			this.onError(event);
		}
	};

}(TW));
/**
 @module Preload
 @namespace Preload
 */

var TW = TW || {};

(function(TW) {

    TW.Preload = TW.Preload ||  {};
    TW.Preload.Preload = Preload;

    if (typeof window.define === "function" && window.define.amd) {
        define('preload/Preload',['./XMLHttpRequestLoader'], function() {
            return Preload;
        });
    }

    /**
     * The preload type for image files, usually png, gif, or jpg/jpeg
     * @property IMAGE
     * @type String
     * @default image
     * @static
     */
    TW.Preload.IMAGE = "image";

    /* The preload type for SVG files.
     * @property SVG
     * @type String
     * @default svg
     * @static
     */
    TW.Preload.SVG = "svg";

    /**
     * The preload type for sound files, usually mp3, ogg, or wav.
     * @property SOUND
     * @type String
     * @default sound
     * @static
     */
    TW.Preload.SOUND = "sound";

    /**
     * The preload type for json files, usually with the "json" file extension.
     * @property JSON
     * @type String
     * @default json
     * @static
     */
    TW.Preload.JSON = "json";

    /**
     * The preload type for css files.
     * @property CSS
     * @type String
     * @default css
     * @static
     */
    TW.Preload.CSS = "css";

    /**
     * The preload type for xml files.
     * @property XML
     * @type String
     * @default xml
     * @static
     */
    TW.Preload.XML = "xml";

    /**
     * The preload type for text files, which is also the default file type if the type can not be determined.
     * @property TEXT
     * @type String
     * @default text
     * @static
     */
    TW.Preload.TEXT = "text";

    /**
     * Time in millseconds to assume a load has failed.
     * @property TIMEOUT_TIME
     * @type Number
     * @default 8000
     * @static
     */
    TW.Preload.TIMEOUT_TIME = 8000;


    /**
     * Preload class is object utility for preload different file format.
     *
     * @class Preload
     * @constructor
     */
    function Preload() {

        /**
         * The next preload queue to process when this one is complete.
         * @property next
         * @type Preload
         * @default null
         */
        this.next = null;

        //Protected properties
        this.typeHandlers = null;
        this.extensionHandlers = null;

        this._maxConnections = 1;

        this._numItems = 0;
        this._numItemsLoaded = 0;
        this._targetProgress = 0;
        this._paused = false;
        this._currentLoads = [];
        this._loadQueue = [];
        this._loadedItemsById = {};
        this._loadedItemsBySrc = {};
        this.typeHandlers = {};
        this.extensionHandlers = {};
        this._loadStartWasDispatched = false;

        /**
         * Determine if this loader has completed already.
         * @property loaded
         * @type Boolean
         * @default false
         */
        this.loaded = false;

        /**
         * The current load progress (percentage) for this item.
         * @property progress
         * @type Number
         * @default 0
         */
        this.progress = 0;

        //Callbacks
        /**
         * The callback to fire when progress changes.
         * @event onProgress
         */
        this.onProgress = null;

        /**
         * The callback to fire when a load starts.
         * @event onLoadStart
         */
        this.onLoadStart = null;

        /**
         * The callback to fire when a file completes.
         * @event onFileLoad
         */
        this.onFileLoad = null;

        /**
         * The callback to fire when a file progress changes.
         * @event onFileProgress
         */
        this.onFileProgress = null;

        /**
         * The callback to fire when all loading is complete.
         * @event onComplete
         */
        this.onComplete = null;

        /**
         * The callback to fire when the loader encounters an error. If the error was encountered
         * by a file, the event will contain the required file data, but the target will be the loader.
         * @event onError
         */
        this.onError = null;
    }

    //Callback proxies
    Preload.prototype._sendLoadStart = function(value) {
        if (this.onLoadStart) {
            this.onLoadStart({target: this});
        }
    };

    Preload.prototype._sendProgress = function(value) {
        var event;
        if (value instanceof Number) {
            this.progress = value;
            event = {loaded: this.progress, total: 1};
        } else {
            event = value;
            this.progress = value.loaded / value.total;
            if (isNaN(this.progress) || this.progress === Infinity) {
                this.progress = 0;
            }
        }
        event.target = this;
        if (this.onProgress) {
            this.onProgress(event);
        }
    };

    Preload.prototype._sendFileProgress = function(event) {
        if (this.onFileProgress) {
            event.target = this;
            this.onFileProgress(event);
        }
    };

    Preload.prototype._sendComplete = function() {
        if (this.onComplete) {
            this.onComplete({target: this});
        }
    };

    Preload.prototype._sendFileComplete = function(event) {
        if (this.onFileLoad) {
            event.target = this;
            this.onFileLoad(event);
        }
    };

    Preload.prototype._sendError = function(event) {
        if (this.onError) {
            if (event === null) {
                event = {};
            }
            event.target = this;
            this.onError(event);
        }
    };

    /**
     * Set the maximum number of concurrent connections.
     * @method setMaxConnections
     * @param {Number} value The number of concurrent loads to allow.
     *  By default, only a single connection is open at any time.
     * Note that browsers and servers may have a built-in maximum number of open connections
     */
    Preload.prototype.setMaxConnections = function(value) {
        this._maxConnections = value;
        if (!this._paused) {
            this._loadNext();
        }
    };

    /**
     * Load a single file. Note that calling loadFile appends to the current queue, so it can be used multiple times
     * to add files. Use <b>loadManifest()</b> to add multiple files at onces.
     * To clear the queue first use the <b>close()</b> method.
     *
     * @method loadFile
     * @param {Object | String} file The file object or path to load. A file can be either
     * <ol>
     *     <li>a path to a resource (string). Note that this kind of load item will be
     *     converted to an object (next item) in the background.</li>
     *     <li>OR an object that contains:<ul>
     *         <li>src: The source of the file that is being loaded. This property is <b>required</b>.
     *         The source can either be a string (recommended), or an HTML tag.</li>
     *         <li>type: The type of file that will be loaded (image, sound, json, etc).
     *         Preload does auto-detection of types using the extension. Supported types are defined on Preload,
     *         such as Preload.IMAGE. It is recommended that a type is specified when
     *         a non-standard file URI (such as a php script) us used.</li>
     *         <li>id: A string identifier which can be used to reference the loaded object.</li>
     *         <li>data: An arbitrary data object, which is included with the loaded object</li>
     *     </ul>
     * </ol>
     * @param {Boolean} loadNow Kick off an immediate load (true) or wait for a load call (false).
     *  The default value is true. If the queue is paused, and this value
     *  is true, the queue will resume.
     */
    Preload.prototype.loadFile = function(file, loadNow) {
        if (file === null) {
            this._sendError({text: "File is null."});
            return;
        }
        this._addItem(file);

        if (loadNow !== false) {
            this.setPaused(false);
        }
    };

    /**
     * Load a manifest. This is a shortcut method to load a group of files.
     * To load a single file, use the loadFile method.
     * Note that calling loadManifest appends to the current queue, so it can be used multiple times to add files.
     * To clear the queue first, use the <b>close()</b> method.
     *
     * @method loadManifest
     * @param {Array} manifest The list of files to load. Each file can be either
     *
     *  - a path to a resource (string). Note that this kind of load item will be
     *    converted to an object (next item) in the background.
     *  - OR an object that contains:
     *    - *src*: The source of the file that is being loaded. This property is **required**.
     *      The source can either be a string (recommended), or an HTML tag.
     *    - *type*: The type of file that will be loaded (image, sound, json, etc).
     *      Preload does auto-detection of types using the extension. Supported types are defined on Preload,
     *      such as Preload.IMAGE.
     *      It is recommended that a type is specified when a non-standard file URI (such as a php script) us used.
     *    - *id*: A string identifier which can be used to reference the loaded object.
     *    - *data*: An arbitrary data object, which is included with the loaded object
     *
     * @param {Boolean} loadNow Kick off an immediate load (true) or wait for a load call (false).
     *  The default value is true. If the queue is paused, and this value
     *  is true, the queue will resume.
     */
    Preload.prototype.loadManifest = function(manifest, loadNow) {
        var data;

        if (manifest instanceof Array) {
            if (manifest.length === 0) {
                this._sendError({text: "Manifest is empty."});
                return;
            }
            data = manifest;
        } else {
            if (manifest === null) {
                this._sendError({text: "Manifest is null."});
                return;
            }
            data = [manifest];
        }

        for (var i = 0, l = data.length; i < l; i++) {
            this._addItem(data[i], false);
        }

        if (loadNow !== false) {
            this._loadNext();
        }
    };

    /**
     * Begin loading the queued items.
     * @method load
     */
    Preload.prototype.load = function() {
        this.setPaused(false);
    };

    /**
     * Lookup a loaded item using either the "id" or "src" that was specified when loading it.
     * @method getResult
     * @param {String} value The "id" or "src" of the loaded item.
     * @return {Object} A result object containing the contents of the object that was initially requested using
     *  loadFile or loadManifest, including:
     * <ol>
     *     <li>src: The source of the file that was requested.</li>
     *     <li>type: The type of file that was loaded. If it was not specified,
     *     this is auto-detected by Preload using the file extension.</li>
     *     <li>id: The id of the loaded object.
     *     If it was not specified, the ID will be the same as the "src" property.</li>
     *     <li>data: Any arbitrary data that was specified, otherwise it will be undefined.
     *     <li>result: The loaded object. Preload provides usable tag elements when possible:<ul>
     *          <li>An HTMLImageElement tag (&lt;image /&gt;) for images</li>
     *          <li>An HTMLAudioElement tag (&lt;audio &gt;) for audio</li>
     *          <li>A script tag for JavaScript (&lt;script&gt;&lt;/script&gt;)</li>
     *          <li>A style tag for CSS (&lt;style&gt;&lt;/style&gt;)</li>
     *          <li>Raw text for JSON or any other kind of loaded item</li>
     *     </ul></li>
     * </ol>
     * This object is also returned via the "onFileLoad" callback, although a "target" will be included,
     * which is a reference to the Preload instance.
     */
    Preload.prototype.getResult = function(value) {
        return this._loadedItemsById[value] || this._loadedItemsBySrc[value];
    };

    /**
     * Pause or resume the current load. The active item will not cancel, but the next
     * items in the queue will not be processed.
     * @method setPaused
     * @param {Boolean} value Whether the queue should be paused or not.
     */
    Preload.prototype.setPaused = function(value) {
        this._paused = value;
        if (!this._paused) {
            this._loadNext();
        }
    };

    /**
     * Close the active queue. Closing a queue completely empties the queue,
     * and prevents any remaining items from starting to
     * download. Note that currently there any active loads will remain open, and events may be processed.<br/><br/>
     * To stop and restart a queue, use the <b>setPaused(true|false)</b> method instead.
     * @method close
     */
    Preload.prototype.close = function() {
        while (this._currentLoads.length) {
            this._currentLoads.pop().cancel();
        }
        this._currentLoads = [];
        this._scriptOrder = [];
        this._loadedScripts = [];
    };


    //Protected Methods
    Preload.prototype._addItem = function(item) {
        var load_item = this._createLoadItem(item);
        if (load_item !== null) {
            this._loadQueue.push(load_item);

            this._numItems++;
            this._updateProgress();
        }
    };

    Preload.prototype._loadNext = function() {
        var load_item;

        if (this._paused) {
            return;
        }

        if (!this._loadStartWasDispatched) {
            this._sendLoadStart();
            this._loadStartWasDispatched = true;
        }

        if (this._numItems === this._numItemsLoaded) {
            this.loaded = true;
            this._sendComplete();
            if (this.next && this.next.load) {
                //LM: Do we need to apply here?
                this.next.load.apply(this.next);
            }
        }

        while (this._loadQueue.length && this._currentLoads.length < this._maxConnections) {
            load_item = this._loadQueue.shift();
            this._loadItem(load_item);
        }
    };

    Preload.prototype._loadItem = function(item) {
        item.onProgress = this._handleProgress.bind(this);
        item.onComplete = this._handleFileComplete.bind(this);
        item.onError = this._handleFileError.bind(this);

        this._currentLoads.push(item);

        item.load();
    };

    Preload.prototype._handleFileError = function(event) {
        var loader = event.target;

        var resultData = this._createResultData(loader.getItem());
        this._numItemsLoaded++;
        this._updateProgress();

        this._sendError(resultData);

        if (!this.stopOnError) {
            this._removeLoadItem(loader);
            this._loadNext();
        }
    };

    Preload.prototype._createResultData = function(item) {
        var resultData = {id: item.id, result: null, data: item.data, type: item.type, src: item.src};
        this._loadedItemsById[item.id] = resultData;
        this._loadedItemsBySrc[item.src] = resultData;
        return resultData;
    };

    Preload.prototype._handleFileComplete = function(event) {
        var loader = event.target;
        var item = loader.getItem();
        var resultData = this._createResultData(item);

        this._removeLoadItem(loader);

        if (loader instanceof TW.Preload.XMLHttpRequestLoader) {
            resultData.result = this._createResult(item, loader.getResult());
        }

        switch (item.type) {
            case TW.Preload.IMAGE: //LM: Consider moving this to XHRLoader
                if (loader instanceof TW.Preload.XMLHttpRequestLoader) {
                    var _this = this; // Use closure workaround to maintain reference to item/result
                    resultData.result.onload = function(event) {
                        _this._handleFileTagComplete(item, resultData);
                    };
                    return;
                }
                break;
            case TW.Preload.SVG:
            case TW.Preload.SOUND:
                break;
            default:
                break;
        }

        this._handleFileTagComplete(item, resultData);
    };

    Preload.prototype._handleFileTagComplete = function(item, resultData) {
        this._numItemsLoaded++;

        if (item.completeHandler) {
            item.completeHandler(resultData);
        }

        this._updateProgress();
        this._sendFileComplete(resultData);

        this._loadNext();
    };

    Preload.prototype._removeLoadItem = function(loader) {
        var l = this._currentLoads.length;
        for (var i = 0; i < l; i++) {
            if (this._currentLoads[i] === loader) {
                this._currentLoads.splice(i, 1);
                return;
            }
        }
    };

    Preload.prototype._createResult = function(item, data) {
        var tag = null;
        var resultData;
        switch (item.type) {
            case TW.Preload.IMAGE:
                tag = this._createImage();
                break;
            case TW.Preload.SOUND:
                tag = item.tag || this._createAudio();
                break;
            case TW.Preload.CSS:
                tag = this._createLink();
                break;
            case TW.Preload.SVG:
                tag = this._createSVG();
                tag.appendChild(this._createXML(data, "image/svg+xml"));
                break;
            case TW.Preload.XML:
                resultData = this._createXML(data, "text/xml");
                break;
            case TW.Preload.JSON:
            case TW.Preload.TEXT:
                resultData = data;
        }

        //LM: Might not need to do this with Audio.
        if (tag) {
            if (item.type === this.CSS) {
                tag.href = item.src;
            } else if (item.type !== this.SVG) {
                tag.src = item.src;
            }
            return tag;
        } else {
            return resultData;
        }
    };

    Preload.prototype._createXML = function(data, type) {
        var resultData;
        var parser;

        if (window.DOMParser) {
            /*global DOMParser */
            parser = new DOMParser();
            resultData = parser.parseFromString(data, type);
        } else { // Internet Explorer
            /*global ActiveXObject */
            parser = new ActiveXObject("Microsoft.XMLDOM");
            parser.async = false;
            parser.loadXML(data);
            resultData = parser;
        }

        return resultData;
    };

    // This is item progress!
    Preload.prototype._handleProgress = function(event) {
        var loader = event.target;
        var resultData = this._createResultData(loader.getItem());
        resultData.progress = loader.progress;
        this._sendFileProgress(resultData);
        this._updateProgress();
    };

    Preload.prototype._updateProgress = function() {
        var loaded = this._numItemsLoaded / this._numItems; // Fully Loaded Progress
        var remaining = this._numItems - this._numItemsLoaded;
        if (remaining > 0) {
            var chunk = 0;
            for (var i = 0, l = this._currentLoads.length; i < l; i++) {
                chunk += this._currentLoads[i].progress;
            }
            loaded += (chunk / remaining) * (remaining / this._numItems);
        }
        this._sendProgress({loaded: loaded, total: 1});
    };

    Preload.prototype._createLoadItem = function(loadItem) {
        var item = {};

        // Create/modify a load item
        switch (typeof(loadItem)) {
            case "string":
                item.src = loadItem;
                break;
            case "object":
                /*global HTMLAudioElement */
                if (loadItem instanceof HTMLAudioElement) {
                    item.tag = loadItem;
                    item.src = item.tag.src;
                    item.type = TW.Preload.SOUND;
                } else {
                    item = loadItem;
                }
                break;
            default:
                break;
        }

        // Get source extension
        item.ext = this._getNameAfter(item.src, ".");
        if (!item.type) {
            item.type = this.getType(item.ext);
        }
        //If there's no id, set one now.
        if (item.id === null || item.id === "") {
            //item.id = this._getNameAfter(item.src, "/");
            item.id = item.src; //[SB] Using the full src is more robust, and more useful from a user perspective.
        }

        // Give plugins a chance to modify the loadItem
        var customHandler = this.typeHandlers[item.type] || this.extensionHandlers[item.ext];
        if (customHandler) {
            var result = customHandler(item.src, item.type, item.id, item.data);
            //Plugin will handle the load, so just ignore it.
            if (result === false) {
                return null;

                // Load as normal
            } /* else if (result === true) {
                // Do Nothing
                // Result is a loader class
            } */ else {
                if (result.src !== null) {
                    item.src = result.src;
                }
                if (result.id !== null) {
                    item.id = result.id;
                }
                if (result.tag !== null && result.tag.load instanceof Function) { //Item has what we need load
                    item.tag = result.tag;
                }
            }

            // Update the extension in case the type changed
            item.ext = this._getNameAfter(item.src, ".");
        }

        return new TW.Preload.XMLHttpRequestLoader(item);
    };

    Preload.prototype.getType = function(ext) {
        switch (ext) {
            case "jpeg":
            case "jpg":
            case "gif":
            case "png":
                return TW.Preload.IMAGE;
            case "ogg":
            case "mp3":
            case "wav":
                return TW.Preload.SOUND;
            case "json":
                return TW.Preload.JSON;
            case "xml":
                return TW.Preload.XML;
            case "css":
                return TW.Preload.CSS;
            case 'svg':
                return TW.Preload.SVG;
            default:
                return TW.Preload.TEXT;
        }
    };

    Preload.prototype._getNameAfter = function(path, token) {
        var dot_index = path.lastIndexOf(token);
        var last_piece = path.substr(dot_index + 1);
        var end_index = last_piece.lastIndexOf(/[\b|\?|\#|\s]/);
        return (end_index === -1) ? last_piece : last_piece.substr(0, end_index);
    };

    Preload.prototype._createImage = function() {
        return document.createElement("img");
    };

    Preload.prototype._createSVG = function() {
        var tag = document.createElement("object");
        tag.type = "image/svg+xml";
        return tag;
    };

    Preload.prototype._createAudio = function() {
        var tag = document.createElement("audio");
        tag.autoplay = false;
        tag.type = "audio/ogg";
        return tag;
    };

    Preload.prototype._createScript = function() {
        var tag = document.createElement("script");
        tag.type = "text/javascript";
        return tag;
    };

    Preload.prototype._createLink = function() {
        var tag = document.createElement("link");
        tag.type = "text/css";
        tag.rel = "stylesheet";
        return tag;
    };

}(TW));

/**
 *
 * @module Preload
 * @main
 */


var TW = TW || {};

if (typeof window.define === "function" && window.define.amd) {

    define('preload',[
        './preload/Preload',
        './preload/XMLHttpRequestLoader'
    ], function() {
        return TW.Preload;
    });

}
;
/**
 @module Audio
 @namespace Audio
 */

var TW = TW || {};

(function(TW) {

    TW.Audio = TW.Audio ||  {};
    TW.Audio.Sound = Sound;

    if (typeof window.define === "function" && window.define.amd) {
        define('audio/Sound',[], function() {
            return Sound;
        });
    }



    TW.Audio.PLAY_SUCCEEDED = "playSucceeded";
    TW.Audio.PLAY_FINISHED = "playFinished";
    TW.Audio.PLAY_FAILED = "playFailed";

    TW.Audio.AUDIO_READY = "canplaythrough";
    TW.Audio.AUDIO_ENDED = "ended";
    TW.Audio.AUDIO_PLAYED = "play";

    /**
     Sound class is object represent html5 sound tag.

     @class Sound
     @constructor
     @param {String} src The source of channel separated with '|' for multi-format.
     */
    function Sound(src) {

        /**
         Audio play state.

         @property playState
         @type Enum
         @default null
         **/
        this.playState = null;

        /**
         Audio loaded state.

         @property loaded
         @type Boolean
         @default false
         **/
        this.loaded = false;

        /**
         Audio offset.

         @property offset
         @type Number
         @default 0
         **/
        this.offset = 0;

        /**
         Audio volume.

         @property volume
         @type Number
         @default 1
         **/
        this.volume = 1;

        /**
         Number of loop already played.

         @property remainingLoops
         @type Number
         @default 0
         **/
        this.remainingLoops = 0;

        /**
         Mute state.

         @property muted
         @type Boolean
         @default false
         **/
        this.muted = false;

        /**
         Pause state.

         @property paused
         @type Boolean
         @default false
         **/
        this.paused = false;

        /**
         Callback function when sound play is complete.

         @property onComplete
         @type Function
         @default null
         **/
        this.onComplete = null;

        /**
         Callback function when sound play restart loop.

         @property onLoop
         @type Function
         @default null
         **/
        this.onLoop = null;

        /**
         Callback function when sound is ready to play.

         @property onReady
         @type Function
         @default null
         **/
        this.onReady = null;

        /**
         Html5 tag audio.

         @property audio
         @type Object
         @default <audio>
         **/
        this.audio = document.createElement("audio");

        /**
         Html5 tag audio capabilities.

         @property audio
         @type Array
         **/
        this.capabilities = {
            mp3: ( this.audio.canPlayType("audio/mp3") !== "no" && this.audio.canPlayType("audio/mp3") !== "" ),
            ogg: ( this.audio.canPlayType("audio/ogg") !== "no" && this.audio.canPlayType("audio/ogg") !== "" ),
            wav: ( this.audio.canPlayType("audio/wav") !== "no" && this.audio.canPlayType("audio/wav") !== "" )
        };

        /**
         Audio source.

         @property src
         @type String
         **/
        this.src = this._parsePath(src);

        this.audio.src = this.src;
        this.endedHandler = this.handleSoundComplete.bind(this);
        this.readyHandler = this.handleSoundReady.bind(this);
    }

    Sound.prototype._parsePath = function(value) {
        var sounds = value.split("|");
        var found = false;
        var c = this.capabilities;
        var i, l;

        for (i = 0, l = sounds.length; i < l; i++) {
            var sound = sounds[i];
            var point = sound.lastIndexOf(".");
            var ext = sound.substr(point + 1).toLowerCase();
            switch (ext) {
                case "mp3":
                    if (c.mp3) {
                        found = true;
                    }
                    break;
                case "ogg":
                    if (c.ogg) {
                        found = true;
                    }
                    break;
                case "wav":
                    if (c.wav) {
                        found = true;
                    }
                    break;
                default:
                    found = false;
            }

            if (found) {
                return sound;
            }
        }
        return null;
    };

    Sound.prototype._cleanUp = function() {
        this.audio.pause();
        try {
            this.audio.currentTime = 0;
        } catch (error) {
        }
        this.audio.removeEventListener(TW.Audio.AUDIO_ENDED, this.endedHandler, false);
        this.audio.removeEventListener(TW.Audio.AUDIO_READY, this.readyHandler, false);
        this.audio = null;
    };

    Sound.prototype._playFailed = function() {
        this.playState = TW.Audio.PLAY_FAILED;
        this._cleanUp();
    };

    /**
     Load sound and call onReady callback when load finish.

     @method load
     @param {Number} offset The offset where sound start.
     @param {Number} loop The number of loop where sound played.
     @param {Number} volume The volume of sound.
     @return {Boolean} True if sound begin the loading or false if the sound loading is impossible.
     **/
    Sound.prototype.load = function(offset, loop, volume) {

        if (this.audio === null) {
            this._playFailed();
            return false;
        }

        this.audio.addEventListener(TW.Audio.AUDIO_ENDED, this.endedHandler, false);

        this.offset = offset;
        this.volume = volume;
        this._updateVolume();
        this.remainingLoops = loop;

        if (this.audio.readyState !== 4) {
            this.audio.addEventListener(TW.Audio.AUDIO_READY, this.readyHandler, false);
            this.audio.load();
        } else {
            this.handleSoundReady();
        }

        return true;
    };

    Sound.prototype.handleSoundReady = function() {
        this.playState = TW.Audio.PLAY_SUCCEEDED;
        this.paused = false;
        this.audio.removeEventListener(TW.Audio.AUDIO_READY, this.readyHandler, false);

        if (this.offset >= this.getDuration()) {
            this._playFailed();
            return;
        }

        this.audio.currentTime = this.offset;

        if (this.onReady !== null) {
            this.onReady(this);
        }
    };

    Sound.prototype.handleSoundComplete = function() {
        if (this.remainingLoops !== 0) {
            this.remainingLoops--;
            try {
                this.audio.currentTime = 0;
            } catch (error) {
            }
            this.audio.play();
            if (this.onLoop !== null) {
                this.onLoop(this);
            }
            return;
        }
        this.playState = TW.Audio.PLAY_FINISHED;

        if (this.onComplete !== null) {
            this.onComplete(this);
        }
    };

    /**
     Start play sound.

     @method play
     **/
    Sound.prototype.play = function() {
        this.audio.play();
        this.playState = TW.Audio.AUDIO_PLAYED;
    };

    /**
     Pause sound.

     @method pause
     **/
    Sound.prototype.pause = function() {
        this.paused = true;
        this.audio.pause();
    };

    /**
     Resume sound.

     @method resume
     **/
    Sound.prototype.resume = function() {
        this.paused = false;
        this.audio.play();
    };

    /**
     Stop sound.

     @method stop
     **/
    Sound.prototype.stop = function() {
        this.pause();
        this.playState = TW.Audio.PLAY_FINISHED;
        try {
            this.audio.currentTime = 0;
        } catch (error) {
        }
    };

    /**
     Set current sound volume.

     @method mute
     @param {Number} value The sound volume.
     **/
    Sound.prototype.setVolume = function(value) {
        value = (value > 1.0) ? 1.0 : value;
        value = (value < 0.0) ? 0.0 : value;
        this.volume = value;
        this._updateVolume();
    };


    Sound.prototype._updateVolume = function() {
        this.audio.volume = this.muted ? 0 : this.volume;
    };

    /**
     Get current sound volume.

     @method getVolume
     @return {Number} A current sound volume.
     **/
    Sound.prototype.getVolume = function() {
        return this.volume;
    };

    /**
     Mute or Unmute all sound in this channel.

     @method mute
     @param {Boolean} isMuted True for mute or false for unmute.
     **/
    Sound.prototype.mute = function(isMuted) {
        this.muted = isMuted;
        this._updateVolume();
    };

    /**
     Get current sound offset.

     @method getPosition
     @return {Number} A current sound offset.
     **/
    Sound.prototype.getPosition = function() {
        return this.audio.currentTime;
    };

    /**
     Set current sound offset.

     @method setPosition
     @param {Number} value The value of offset.
     **/
    Sound.prototype.setPosition = function(value) {
        try {
            this.audio.currentTime = value;
        } catch (error) {
        }
    };

    /**
     Get current sound duration.

     @method getDuration
     @return {Number} A current sound duration.
     **/
    Sound.prototype.getDuration = function() {
        return this.audio.duration;
    };

}(TW));

/**
 @module Audio
 @namespace Audio
 */

var TW = TW || {};

(function(TW) {

    TW.Audio = TW.Audio ||  {};
    TW.Audio.Channel = Channel;

    if (typeof window.define === "function" && window.define.amd) {
        define('audio/Channel',['./Sound'], function() {
            return Channel;
        });
    }

    /**
     Channel class is utility for manage multiple sound with same source.

     @class Channel
     @constructor
     @param {String} src The source of channel separated with '|' for multi-format.
     @param {Number} max The number of sound allocated in this channel.
     @param {Number} id The identifier of the channel.
     */
    function Channel(src, max, id) {

        /**
         Array of Sound.

         @property sounds
         @type Object
         @default empty
         **/
        this.sounds = [];

        /**
         Volume of all sound in this channel.

         @property volume
         @type Number
         @default 1
         **/
        this.volume = 1;

        /**
         Callback function when all sound is ready to play in this channel.

         @property allSoundsReady
         @type Function
         @default null
         **/
        this.allSoundsReady = null;

        this.allSoundsReadyHandler = this.handleAllSoundsReady.bind(this);

        /**
         Source sound for this channel.

         @property src
         @type String
         @default src
         **/
        this.src = src;

        /**
         Channel id.

         @property id
         @type Number
         @default id
         **/
        this.id = id;

        this.add(max);
    }

    /**
     Add max sound instance with sources in channel.

     @method add
     @param {Number} max The number of sound allocated in this channel.
     **/
    Channel.prototype.add = function(max) {

        while (this.sounds.length < max) {
            this.sounds.push(new TW.Audio.Sound(this.src));
        }
    };

    /**
     Load all sound.

     @method load
     **/
    Channel.prototype.load = function() {

        for (var i = 0; i < this.sounds.length; ++i) {
            var sound = this.sounds[i];
            if (i === 0) {
                sound.onReady = this.allSoundsReadyHandler;
            }
            sound.load(0, 0, 1);
        }
    };

    /**
     Get a playable sound.

     @method getPlayableSound
     @return {Object} A playable sound.
     **/
    Channel.prototype.getPlayableSound = function() {
        var i = 0;
        var sound;

        for (i = 0; i < this.sounds.length; ++i) {
            sound = this.sounds[i];
            if (sound.playState !==  TW.Audio.AUDIO_PLAYED) {
                return this.sounds[i];
            }
        }
        this.sounds[0].stop();
        return this.sounds[0];
    };

    Channel.prototype.handleAllSoundsReady = function(sound) {
        if (this.allSoundsReady !== null) {
            this.allSoundsReady(this);
        }
    };

    Channel.prototype.tellAllSounds = function(command, value) {

        for (var i = this.sounds.length - 1; i >= 0; --i) {
            var sound = this.sounds[i];
            switch (command) {
                case "pause":
                    sound.pause();
                    break;
                case "resume":
                    sound.resume();
                    break;
                case "setVolume":
                    sound.setVolume(value);
                    break;
                case "mute":
                    sound.mute(value);
                    break;
                case "stop":
                    sound.stop();
                    break;
                default:
            }
        }
    };

    /**
     Mute or Unmute all sound in this channel.

     @method setMute
     @param {Boolean} isMuted True for mute or false for unmute.
     **/
    Channel.prototype.setMute = function(isMuted) {
        this.tellAllSounds("mute", isMuted);
    };

    /**
     Pause all sound in this channel.

     @method pause
     **/
    Channel.prototype.pause = function() {
        this.tellAllSounds("pause", null);
    };

    /**
     Resume all sound in this channel.

     @method resume
     **/
    Channel.prototype.resume = function() {
        this.tellAllSounds("resume", null);
    };

    /**
     Stop all sound in this channel.

     @method stop
     **/
    Channel.prototype.stop = function() {
        this.tellAllSounds("stop", null);
    };

    /**
     Set a volume for all sound in this channel.

     @method setMasterVolume
     @param {Number} value The value of volume needed. min: 0.0 -> max: 1.0
     **/
    Channel.prototype.setMasterVolume = function(value) {
        this.tellAllSounds("setVolume", value);
    };

}(TW));
/**
 @module Audio
 @namespace Audio
 */

var TW = TW || {};

(function(TW) {

    TW.Audio = TW.Audio ||  {};
    TW.Audio.Manager = Manager;

    if (typeof window.define === "function" && window.define.amd) {
        define('audio/Manager',['./Channel'], function() {
            return Manager;
        });
    }


    /**
     * Manager class is utility for manage all sound in channel.
     *
     * @class Manager
     * @constructor
     */
    function Manager() {

        /**
         * Array of Channel.
         *
         * @property {Array} instances
         * @default empty
         **/
        this.instances = [];

        /**
         * Number of Channel.
         *
         * @property {Number} length
         * @default 0
         **/
        this.length = 0;

        /**
         * LastId of Channel.
         *
         * @property {Number} lastId
         * @default 0
         **/
        this.lastId = 0;

        /**
         * Number of Channel ready to play.
         *
         * @property {Number} ready
         * @default 0
         **/
        this.ready = 0;

        /**
         * Callback function when all channel is ready to play.
         *
         * @property {Function} allInstancesReady
         * @default null
         **/
        this.allInstancesReady = null;

        /**
         * Callback function when a channel is ready to play.
         *
         * @property {Function} instanceReady
         * @default null
         **/
        this.instanceReady = null;

        /**
         Volume of all sound in all channel.

         @property volume
         @type Number
         @default 1
         **/
        this.masterVolume = 1;

        this.allInstancesReadyHandler = this.handleAllInstancesReady.bind(this);
    }

    /**
     Create new channel with src and max sound instance.

     @method add
     @param {String} src The source of channel separated with '|' for multiformat.
     @param {Number} max The number of sound allocated in this channel.
     @return {Number} The id of the channel.
     **/
    Manager.prototype.add = function(src, max) {
        this.lastId++;
        this.instances[this.lastId] = new TW.Audio.Channel(src, max, this.lastId);
        this.length++;
        return this.lastId;
    };

    /**
     Remove a channel.

     @method remove
     @param {Number} uniqueId The id of the channel need remove.
     @return {Boolean} True if the channel has been remove or False.
     **/
    Manager.prototype.remove = function(uniqueId) {
        if (this.instances[uniqueId] === null) {
            return false;
        }
        delete this.instances[uniqueId];
        this.length--;
        return true;
    };

    /**
     Get a channel.

     @method get
     @param {Number} uniqueId The id of the channel need get.
     @return {Object} The channel with uniqueId.
     **/
    Manager.prototype.get = function(uniqueId) {
        return this.instances[uniqueId];
    };

    /**
     Get a playable sound.

     @method getPlayableSound
     @param {Number} uniqueId The id of the channel need get a sound.
     @return {Object} A playable sound.
     **/
    Manager.prototype.getPlayableSound = function(uniqueId) {
        return this.instances[uniqueId].getPlayableSound();
    };

    /**
     Load all sounds on all channels.

     @method loadAll
     **/
    Manager.prototype.loadAll = function() {
        this.ready = 0;
        for (var key in this.instances) {
            var sounds = this.instances[key];
            sounds.allSoundsReady = this.allInstancesReadyHandler;
            sounds.load();
        }
    };

    Manager.prototype.handleAllInstancesReady = function(channel) {
        this.ready++;

        if (this.instanceReady !== null) {
            this.instanceReady(channel.id);
        }
        if (this.allInstancesReady !== null && this.ready === this.length) {
            this.allInstancesReady();
        }
    };

    Manager.prototype.tellAllInstances = function(command, value) {
        var key;
        var sound;

        for (key in this.instances) {
            var sounds = this.instances[key];
            switch (command) {
                case "pause":
                    sounds.pause();
                    break;
                case "resume":
                    sounds.resume();
                    break;
                case "setVolume":
                    sounds.setMasterVolume(value);
                    break;
                case "mute":
                    sounds.setMute(value);
                    break;
                case "stop":
                    sounds.stop();
                    break;
            }
        }
    };

    /**
     Get a current master volume.

     @method getMasterVolume
     @return {Number} A current master volume.
     **/
    Manager.prototype.getMasterVolume = function() {
        return this.masterVolume;
    };

    /**
     Mute or Unmute all sound in every channel.

     @method setMute
     @param {Boolean} isMuted True for mute or false for unmute.
     **/
    Manager.prototype.setMute = function(isMuted) {
        this.tellAllInstances("mute", isMuted);
    };

    /**
     Pause all sound in every channel.

     @method pause
     **/
    Manager.prototype.pause = function() {
        this.tellAllInstances("pause", null);
    };

    /**
     Resume all sound in every channel.

     @method resume
     **/
    Manager.prototype.resume = function() {
        this.tellAllInstances("resume", null);
    };

    /**
     Stop all sound in every channel.

     @method stop
     **/
    Manager.prototype.stop = function() {
        this.tellAllInstances("stop", null);
    };

    /**
     Set a volume for all sound in every channel.

     @method setMasterVolume
     @param {Number} value The value of volume needed. min: 0.0 -> max: 1.0
     **/
    Manager.prototype.setMasterVolume = function(value) {
        value = (value > 1.0) ? 1.0 : value;
        value = (value < 0.0) ? 0.0 : value;

        this.masterVolume = value;
        this.tellAllInstances("setVolume", value);
    };

}(TW));
/**
 * TODO: describe module here.
 *
 * @module Audio
 * @main
 */


var TW = TW || {};

if (typeof window.define === "function" && window.define.amd) {

    define('audio',[
        './audio/Sound',
        './audio/Manager',
        './audio/Channel'
    ], function() {
        return TW.Audio;
    });

}
;
/**
 * This module contain some useful functions and helpers used in the Tumbleweed framework.
 * It include some pollyfills and a way to use inheritance.
 *
 * Polyfills are not requested, but give a more large browser compatibility.
 *
 * @module Utils
 * @main
 */


var TW = TW || {};

if (typeof window.define === "function" && window.define.amd) {

    define('utils',[
        './utils/Inheritance'
    ], function() {
        return TW.Utils;
    });

}
;

var TW = TW || {};

if (typeof window.define === "function" && window.define.amd) {

	define('TW',['collision',
	        'event',
	        'gameloop',
	        'graphic',
	        'math',
	        'preload',
	        'audio',
	        'utils'
		   ], function(a) {
			   return TW;
		   });
}
;